<?php

namespace App\Services;

use App\Models\Client;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ClientUserService
{
    /**
     * Create or update user account for a client when portal access is enabled.
     *
     * When $plainPassword is provided, the password will be applied to the
     * resulting user (new or existing). When null and the user is new, a
     * secure random password is generated as fallback.
     *
     * @return array{user: User, password: string|null, is_new: bool}
     */
    public function createOrUpdateClientUser(Client $client, ?string $plainPassword = null): array
    {
        try {
            return DB::transaction(function () use ($client, $plainPassword) {
                // Refresh client data within transaction to avoid race conditions
                $client = Client::lockForUpdate()->find($client->id);

                if (! $client) {
                    throw new \Exception('Client not found');
                }

                // Check if client already has a user
                if ($client->user_id && $client->user) {
                    $existing = $client->user;

                    if ($plainPassword !== null && $plainPassword !== '') {
                        // User model has 'password' => 'hashed' cast which auto-hashes.
                        // Assigning raw plaintext is enough; do NOT pre-hash.
                        $existing->forceFill(['password' => $plainPassword])->save();
                    }

                    return [
                        'user' => $existing->fresh(),
                        'password' => null,
                        'is_new' => false,
                    ];
                }

                $email = $client->email ?: $this->generateClientEmail($client);
                $username = $this->generateUniqueUsername($client);
                $isPasswordProvided = $plainPassword !== null && $plainPassword !== '';
                $password = $isPasswordProvided ? $plainPassword : $this->generatePassword();

                // Check if user already exists with this email
                $existingUser = User::where('email', $email)->first();

                if ($existingUser) {
                    // Update existing user with unique username
                    $attributes = [
                        'name' => $client->company_name,
                        'username' => $username,
                    ];

                    if ($isPasswordProvided) {
                        // Auto-hashed by cast; pass plaintext, not pre-hashed value.
                        $attributes['password'] = $plainPassword;
                    }

                    $existingUser->update($attributes);

                    // Update client relation
                    $client->update(['user_id' => $existingUser->id]);

                    return [
                        'user' => $existingUser->fresh(),
                        'password' => null,
                        'is_new' => false,
                    ];
                }

                // Create new user. Cast 'password' => 'hashed' handles hashing.
                $user = User::create([
                    'name' => $client->company_name,
                    'username' => $username,
                    'email' => $email,
                    'password' => $password,
                ]);

                // Assign client role if exists
                if (method_exists($user, 'assignRole')) {
                    $user->assignRole('client');
                }

                // Update client relation
                $client->update(['user_id' => $user->id]);

                return [
                    'user' => $user,
                    'password' => $isPasswordProvided ? null : $password,
                    'is_new' => true,
                ];
            });
        } catch (Throwable $e) {
            // Surface the real error to Laravel's log so the failure is diagnosable
            // even when APP_DEBUG=false hides it from the HTTP response.
            Log::error('ClientUserService::createOrUpdateClientUser failed', [
                'client_id' => $client->id ?? null,
                'client_code' => $client->client_code ?? null,
                'email' => $client->email ?? null,
                'portal_access_enabled' => (bool) ($client->portal_access_enabled ?? false),
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile().':'.$e->getLine(),
            ]);

            throw $e;
        }
    }

    /**
     * Disable client user access
     */
    public function disableClientUser(Client $client): void
    {
        if ($client->user) {
            // Option 1: Soft delete/disable user
            // Option 2: Remove role
            // Option 3: Just keep the relation but mark as inactive

            // For now, just remove the user_id relation
            $client->update(['user_id' => null]);
        }
    }

    /**
     * Generate username from client code
     * CLI-2025-0001 becomes cli20250001
     */
    private function generateUsername(Client $client): string
    {
        $code = (string) ($client->client_code ?? '');

        if ($code === '') {
            $code = 'client-'.($client->id ?? random_int(1, PHP_INT_MAX));
        }

        $base = strtolower(str_replace(['-', '_'], '', $code));

        // Trim to leave room for optional suffix (_NNN) within 255-char limit.
        return substr($base, 0, 240);
    }

    /**
     * Generate unique username, append suffix if already exists.
     * Loops with bounded retries to avoid infinite loops on pathological data.
     */
    private function generateUniqueUsername(Client $client): string
    {
        $baseUsername = $this->generateUsername($client);
        $username = $baseUsername;
        $suffix = 1;
        $maxAttempts = 1000;

        while ($suffix <= $maxAttempts && User::where('username', $username)->exists()) {
            $username = $baseUsername.'_'.$suffix;
            $suffix++;
        }

        return $username;
    }

    /**
     * Generate email for client if not provided
     */
    private function generateClientEmail(Client $client): string
    {
        $username = $this->generateUsername($client);

        return $username.'@client.local';
    }

    /**
     * Generate random secure password
     */
    private function generatePassword(): string
    {
        return Str::random(12);
    }
}
