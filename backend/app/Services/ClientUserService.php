<?php

namespace App\Services;

use App\Models\Client;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
                    $existing->forceFill(['password' => Hash::make($plainPassword)])->save();
                }

                return [
                    'user' => $existing->fresh(),
                    'password' => null,
                    'is_new' => false,
                ];
            }

            $email = $client->email ?? $this->generateClientEmail($client);
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
                    $attributes['password'] = Hash::make($plainPassword);
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

            // Create new user
            $user = User::create([
                'name' => $client->company_name,
                'username' => $username,
                'email' => $email,
                'password' => Hash::make($password),
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
        return strtolower(str_replace(['-', '_'], '', $client->client_code));
    }

    /**
     * Generate unique username, append suffix if already exists
     */
    private function generateUniqueUsername(Client $client): string
    {
        $baseUsername = $this->generateUsername($client);
        $username = $baseUsername;
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
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
