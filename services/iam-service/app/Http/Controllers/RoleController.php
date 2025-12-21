<?php

namespace App\Http\Controllers;

use App\Http\Requests\Role\AssignRoleRequest;
use App\Http\Requests\Role\RemoveRoleRequest;
use App\Services\RoleService;
use App\Exceptions\ClientErrorException;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class RoleController extends Controller
{
    private RoleService $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    #[OA\Get(
        path: "/roles",
        summary: "List all roles with permissions",
        tags: ["Roles"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Roles retrieved successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function index()
    {
        $roles = $this->roleService->getAllRoles();

        return successResponse('Roles retrieved successfully', $roles);
    }

    #[OA\Get(
        path: "/roles/user/{userId}",
        summary: "Get user roles",
        tags: ["Roles"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "userId", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "User roles retrieved successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function getUserRoles(Request $request, int $userId)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $userRoles = $this->roleService->getUserRoles($userId, $companyId);

        return successResponse('User roles retrieved successfully', $userRoles);
    }

    #[OA\Post(
        path: "/roles/assign",
        summary: "Assign role to user",
        tags: ["Roles"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["user_id", "role_slug"],
                    properties: [
                        new OA\Property(property: "user_id", type: "integer", example: 1),
                        new OA\Property(property: "role_slug", type: "string", example: "project-manager"),
                        new OA\Property(property: "resource_type", type: "string", nullable: true, example: "project"),
                        new OA\Property(property: "resource_id", type: "integer", nullable: true, example: 123),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Role assigned successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 400, description: "Failed to assign role"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function assignRole(AssignRoleRequest $request)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $assigned = $this->roleService->assignRole(
            $request->validated()['user_id'],
            $request->validated()['role_slug'],
            $companyId,
            $request->validated()['resource_type'] ?? null,
            $request->validated()['resource_id'] ?? null
        );

        if (!$assigned) {
            throw new ClientErrorException('Failed to assign role. Role not found.');
        }

        return successResponse('Role assigned successfully');
    }

    #[OA\Post(
        path: "/roles/remove",
        summary: "Remove role from user",
        tags: ["Roles"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["user_id", "role_slug"],
                    properties: [
                        new OA\Property(property: "user_id", type: "integer", example: 1),
                        new OA\Property(property: "role_slug", type: "string", example: "project-manager"),
                        new OA\Property(property: "resource_type", type: "string", nullable: true, example: "project"),
                        new OA\Property(property: "resource_id", type: "integer", nullable: true, example: 123),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Role removed successfully"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 400, description: "Failed to remove role"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function removeRole(RemoveRoleRequest $request)
    {
        $removed = $this->roleService->removeRole(
            $request->validated()['user_id'],
            $request->validated()['role_slug'],
            $request->validated()['resource_type'] ?? null,
            $request->validated()['resource_id'] ?? null
        );

        if (!$removed) {
            throw new ClientErrorException('Failed to remove role. Role assignment not found.');
        }

        return successResponse('Role removed successfully');
    }
}

