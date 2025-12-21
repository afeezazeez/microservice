<?php

namespace App\Http\Controllers;

use App\Http\Requests\Role\AssignRoleRequest;
use App\Http\Requests\Role\RemoveRoleRequest;
use App\Services\RoleService;
use App\Exceptions\ClientErrorException;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    private RoleService $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    public function index()
    {
        $roles = $this->roleService->getAllRoles();

        return successResponse('Roles retrieved successfully', $roles);
    }

    public function getUserRoles(Request $request, int $userId)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $userRoles = $this->roleService->getUserRoles($userId, $companyId);

        return successResponse('User roles retrieved successfully', $userRoles);
    }

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

