<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Requests\User\InviteUserRequest;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    private UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    #[OA\Post(
        path: "/users",
        summary: "Invite/create a new user",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "name", type: "string", example: "Jane Doe"),
                        new OA\Property(property: "email", type: "string", format: "email", example: "jane@acme.com"),
                        new OA\Property(property: "role_slug", type: "string", nullable: true, example: "team-member"),
                        new OA\Property(property: "resource_type", type: "string", nullable: true, example: "project"),
                        new OA\Property(property: "resource_id", type: "integer", nullable: true, example: 123),
                    ],
                    required: ["name", "email"]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "User invited successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 400, description: "Validation error"),
        ]
    )]
    public function store(InviteUserRequest $request)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        $user = $this->userService->inviteUser($companyId, $request->validated());

        return successResponse('User invited successfully', $user, Response::HTTP_CREATED);
    }

    #[OA\Get(
        path: "/users",
        summary: "List all users in company",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Users retrieved successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function index(Request $request)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        $users = $this->userService->listUsers($companyId);

        return successResponse('Users retrieved successfully', $users);
    }

    #[OA\Get(
        path: "/users/{id}",
        summary: "Get user by ID",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "User retrieved successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 400, description: "User not found"),
        ]
    )]
    public function show(Request $request, int $id)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        $user = $this->userService->getUserById($id, $companyId);

        return successResponse('User retrieved successfully', $user);
    }

    #[OA\Put(
        path: "/users/{id}",
        summary: "Update user",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "name", type: "string", example: "John Doe"),
                        new OA\Property(property: "email", type: "string", format: "email", example: "john@acme.com"),
                        new OA\Property(property: "password", type: "string", format: "password", example: "newpassword123"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "User updated successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 400, description: "User not found"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function update(UpdateUserRequest $request, int $id)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        $user = $this->userService->updateUser($id, $companyId, $request->validated());

        return successResponse('User updated successfully', $user);
    }

    #[OA\Delete(
        path: "/users/{id}",
        summary: "Delete user",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "User deleted successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 400, description: "User not found"),
        ]
    )]
    public function destroy(Request $request, int $id)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        $this->userService->deleteUser($id, $companyId);

        return successResponse('User deleted successfully');
    }
}

