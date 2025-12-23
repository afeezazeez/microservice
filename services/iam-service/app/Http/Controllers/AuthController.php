<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterCompanyRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Services\AuthService;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    #[OA\Post(
        path: "/auth/register",
        summary: "Register company and admin user",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "company", type: "object", properties: [
                            new OA\Property(property: "name", type: "string", example: "Acme Corp"),
                            new OA\Property(property: "email", type: "string", format: "email", example: "contact@acme.com"),
                            new OA\Property(property: "phone", type: "string", nullable: true, example: "+1234567890"),
                            new OA\Property(property: "address", type: "string", nullable: true, example: "123 Main St"),
                        ]),
                        new OA\Property(property: "user", type: "object", properties: [
                            new OA\Property(property: "name", type: "string", example: "John Doe"),
                            new OA\Property(property: "email", type: "string", format: "email", example: "john@acme.com"),
                            new OA\Property(property: "password", type: "string", format: "password", example: "password123"),
                            new OA\Property(property: "password_confirmation", type: "string", format: "password", example: "password123"),
                        ]),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Company registered successfully"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function registerCompany(RegisterCompanyRequest $request)
    {
        $result = $this->authService->registerCompany(
            $request->validated()['company'],
            $request->validated()['user']
        );

        return successResponse('Company registered successfully', $result, Response::HTTP_OK);
    }

    #[OA\Post(
        path: "/auth/login",
        summary: "User login",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["email", "password"],
                    properties: [
                        new OA\Property(property: "email", type: "string", format: "email", example: "john@acme.com"),
                        new OA\Property(property: "password", type: "string", format: "password", example: "password123"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Login successful"),
            new OA\Response(response: 400, description: "Invalid credentials"),
        ]
    )]
    public function login(LoginRequest $request)
    {
        $result = $this->authService->login(
            $request->validated()['email'],
            $request->validated()['password']
        );

        return successResponse('Login successful', $result);
    }

    #[OA\Post(
        path: "/auth/refresh",
        summary: "Refresh JWT token",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["token"],
                    properties: [
                        new OA\Property(property: "token", type: "string", example: "eyJ0eXAiOiJKV1QiLCJhbGc..."),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Token refreshed successfully"),
            new OA\Response(response: 400, description: "Invalid or expired token"),
        ]
    )]
    public function refreshToken(RefreshTokenRequest $request)
    {
        $token = $this->authService->refreshToken($request->validated()['token']);

        return successResponse('Token refreshed successfully', [
            'token' => $token,
        ]);
    }

    #[OA\Post(
        path: "/auth/logout",
        summary: "Logout user (blacklist token)",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Logged out successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function logout()
    {
        $token = $this->extractTokenFromRequest();

        $this->authService->logout($token);

        return successResponse('Logged out successfully');
    }

    #[OA\Get(
        path: "/auth/me",
        summary: "Get authenticated user details",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "User retrieved successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function me()
    {
        $userId = request()->input('authenticated_user_id') ?? request()->input('user_data.id');
        
        if (!$userId) {
            return errorResponse('User not authenticated', [], null, [], 401);
        }
        
        $user = $this->authService->getAuthenticatedUser($userId);

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

