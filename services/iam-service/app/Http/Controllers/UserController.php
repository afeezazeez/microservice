<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\UpdateUserRequest;
use App\Services\UserService;
use App\Exceptions\ClientErrorException;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    private UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
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

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

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

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $user = $this->userService->getUserById($id, $companyId);

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

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

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $user = $this->userService->updateUser($id, $companyId, $request->validated());

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

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

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $deleted = $this->userService->deleteUser($id, $companyId);

        if (!$deleted) {
            throw new ClientErrorException('User not found');
        }

        return successResponse('User deleted successfully');
    }
}

