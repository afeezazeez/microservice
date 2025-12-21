<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterCompanyRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Services\AuthService;
use App\Exceptions\ClientErrorException;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function registerCompany(RegisterCompanyRequest $request)
    {
        $result = $this->authService->registerCompany(
            $request->validated()['company'],
            $request->validated()['user']
        );

        return successResponse('Company registered successfully', $result, Response::HTTP_OK);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login(
            $request->validated()['email'],
            $request->validated()['password']
        );

        if (!$result) {
            throw new ClientErrorException('Invalid credentials');
        }

        return successResponse('Login successful', $result);
    }

    public function refreshToken(RefreshTokenRequest $request)
    {
        $token = $this->authService->refreshToken($request->validated()['token']);

        if (!$token) {
            throw new ClientErrorException('Invalid or expired token');
        }

        return successResponse('Token refreshed successfully', [
            'token' => $token,
        ]);
    }

    public function logout()
    {
        $token = $this->extractTokenFromRequest();

        if (!$token) {
            throw new ClientErrorException('Token not provided');
        }

        $this->authService->logout($token);

        return successResponse('Logged out successfully');
    }

    public function me()
    {
        $userId = request()->input('user_id');
        
        $user = $this->authService->getAuthenticatedUser($userId);

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

        return successResponse('User retrieved successfully', $user);
    }

    private function extractTokenFromRequest(): ?string
    {
        $authorization = request()->header('Authorization');

        if (!$authorization) {
            return null;
        }

        if (str_starts_with($authorization, 'Bearer ')) {
            return substr($authorization, 7);
        }

        return null;
    }
}

