<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateAuthenticatedPasswordRequest;
use App\Http\Requests\UpdateAuthenticatedProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $abilities = $user->getAllPermissions()->pluck('name')->values()->all();

        $token = $user->createToken($request->string('device_name')->toString(), $abilities);

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'user' => $this->authUserPayload($user),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $this->authUserPayload($user),
        ]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', File::image()->max('2mb')],
        ]);

        /** @var User $user */
        $user = $request->user();

        $oldAvatarPath = $user->avatar;
        $newAvatarPath = $validated['avatar']->store('avatars', 'public');

        $user->forceFill([
            'avatar' => $newAvatarPath,
        ])->save();

        if (is_string($oldAvatarPath) && $oldAvatarPath !== '' && $oldAvatarPath !== $newAvatarPath) {
            Storage::disk('public')->delete($oldAvatarPath);
        }

        return response()->json([
            'message' => 'Avatar updated successfully.',
            'data' => $this->authUserPayload($user->fresh()),
        ]);
    }

    public function updateProfile(UpdateAuthenticatedProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->update($request->validated());

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => $this->authUserPayload($user->fresh()),
        ]);
    }

    public function updatePassword(UpdateAuthenticatedPasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->forceFill([
            'password' => $request->string('password')->toString(),
        ])->save();

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function authUserPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'avatar_url' => $this->avatarUrl($user->avatar),
            'roles' => $user->getRoleNames()->values(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ];
    }

    private function avatarUrl(?string $avatarPath): ?string
    {
        if (! $avatarPath) {
            return null;
        }

        $publicDiskUrl = rtrim((string) config('filesystems.disks.public.url', '/storage'), '/');

        return "{$publicDiskUrl}/{$avatarPath}";
    }
}
