<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTService
{
    private string $secret;
    private int $accessTokenTtl;
    private int $refreshTokenTtl;
    private UserRepository $userRepository;
    private PermissionService $permissionService;

    public function __construct(UserRepository $userRepository, PermissionService $permissionService)
    {
        $this->secret = config('jwt.secret');
        $this->accessTokenTtl = (int) config('jwt.access_token_ttl', 5);
        $this->refreshTokenTtl = (int) config('jwt.refresh_token_ttl', 1440);
        $this->userRepository = $userRepository;
        $this->permissionService = $permissionService;
    }

    public function generateAccessToken(User $user): string
    {
        if (!$user->relationLoaded('company')) {
            $user->load('company');
        }

        $roles = $user->roles()
            ->where('user_roles.company_id', $user->company_id)
            ->whereNull('user_roles.resource_type')
            ->pluck('slug')
            ->toArray();

        $permissions = $this->permissionService->getUserPermissions($user->id, $user->company_id);

        $payload = [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'company_id' => $user->company_id,
            'company_name' => $user->company?->name,
            'roles' => $roles,
            'permissions' => $permissions,
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes($this->accessTokenTtl)->timestamp,
            'type' => 'access',
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function generateRefreshToken(User $user): string
    {
        $payload = [
            'id' => $user->id,
            'company_id' => $user->company_id,
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes($this->refreshTokenTtl)->timestamp,
            'type' => 'refresh',
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function validateToken(string $token, ?string $expectedType = null): ?array
    {
        try {
            if ($this->isTokenBlacklisted($token)) {
                return null;
            }

            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            $decodedArray = (array) $decoded;

            if ($expectedType && ($decodedArray['type'] ?? null) !== $expectedType) {
                return null;
            }

            return $decodedArray;
        } catch (\Exception $e) {
            Log::error('JWT validation failed: ' . $e->getMessage());
            return null;
        }
    }

    public function blacklistToken(string $token): bool
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            $decodedArray = (array) $decoded;
            
            $expirationTime = $decodedArray['exp'] ?? now()->addMinutes($this->accessTokenTtl)->timestamp;
            $ttl = max(0, $expirationTime - now()->timestamp);

            $tokenId = $this->getTokenId($token);
            Cache::put("jwt:blacklist:{$tokenId}", true, $ttl);

            return true;
        } catch (\Exception $e) {
            Log::error('Token blacklist failed: ' . $e->getMessage());
            return false;
        }
    }

    private function isTokenBlacklisted(string $token): bool
    {
        $tokenId = $this->getTokenId($token);
        return Cache::has("jwt:blacklist:{$tokenId}");
    }

    private function getTokenId(string $token): string
    {
        return hash('sha256', $token);
    }

    public function refreshAccessToken(string $refreshToken): ?string
    {
        $decoded = $this->validateToken($refreshToken, 'refresh');
        
        if (!$decoded) {
            return null;
        }

        $user = $this->userRepository->findById($decoded['id']);
        
        if (!$user) {
            return null;
        }

        if ($user->company_id !== ($decoded['company_id'] ?? null)) {
            return null;
        }

        return $this->generateAccessToken($user);
    }
}

