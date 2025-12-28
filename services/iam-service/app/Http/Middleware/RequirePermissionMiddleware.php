<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $userData = $request->input('user_data');

        if (!$userData) {
            return errorResponse('User not authenticated', [], null, [], 401);
        }

        $userPermissions = $userData['permissions'] ?? [];

        if (!in_array($permission, $userPermissions)) {
            return errorResponse('You do not have permission to perform this action', [], null, [], 403);
        }

        return $next($request);
    }
}

