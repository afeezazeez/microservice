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
    private int $ttl;
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->secret = config('jwt.secret');
        $this->ttl = (int) config('jwt.ttl');
        $this->userRepository = $userRepository;
    }

    public function generateToken(User $user): string
    {
        // Load company relation if not already loaded
        if (!$user->relationLoaded('company')) {
            $user->load('company');
        }

        // Get user's role slugs for this company
        $roles = $user->roles()
            ->where('user_roles.company_id', $user->company_id)
            ->whereNull('user_roles.resource_type')
            ->pluck('slug')
            ->toArray();

        $payload = [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'company_id' => $user->company_id,
            'company_name' => $user->company?->name,
            'roles' => $roles,
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes($this->ttl)->timestamp,
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function validateToken(string $token): ?array
    {
        try {
            if ($this->isTokenBlacklisted($token)) {
                return null;
            }

            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            return (array) $decoded;
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
            
            $expirationTime = $decodedArray['exp'] ?? now()->addMinutes($this->ttl)->timestamp;
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

    public function refreshToken(string $token): ?string
    {
        $decoded = $this->validateToken($token);
        
        if (!$decoded) {
            return null;
        }

        $user = $this->userRepository->findById($decoded['id']);
        
        if (!$user) {
            return null;
        }

        return $this->generateToken($user);
    }
}

