<?php

namespace App\Http\Middleware;

use App\Services\JWTService;
use Closure;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JWTAuthMiddleware
{
    private JWTService $jwtService;

    public function __construct(JWTService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractTokenFromRequest($request);

        if (!$token) {
            return errorResponse('Token not provided', [], null, [], 401);
        }

        $decoded = $this->jwtService->validateToken($token, 'access');

        if (!$decoded) {
            return errorResponse('Invalid or expired token', [], null, [], 401);
        }

        $userId = $decoded['id'] ?? null;
      
        // Preserve original request payload; expose authenticated user under dedicated keys
        $request->merge([
            'authenticated_user_id' => $userId,
            'user_data' => $decoded,
        ]);

        return $next($request);
    }

    private function extractTokenFromRequest(Request $request): ?string
    {
        $authorization = $request->header('Authorization');

        if (!$authorization) {
            return null;
        }

        if (str_starts_with($authorization, 'Bearer ')) {
            return substr($authorization, 7);
        }

        return null;
    }
}

