<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
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
        $this->ttl = config('jwt.ttl');
        $this->userRepository = $userRepository;
    }

    public function generateToken(User $user): string
    {
        $payload = [
            'id' => $user->id,
            'email' => $user->email,
            'company_id' => $user->company_id,
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes($this->ttl)->timestamp,
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            return (array) $decoded;
        } catch (\Exception $e) {
            Log::error('JWT validation failed: ' . $e->getMessage());
            return null;
        }
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

