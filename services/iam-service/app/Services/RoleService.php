<?php

namespace App\Services;

use App\Exceptions\ClientErrorException;
use App\Repositories\RoleRepository;
use App\Repositories\UserRoleRepository;

class RoleService
{
    private RoleRepository $roleRepository;
    private UserRoleRepository $userRoleRepository;

    public function __construct(
        RoleRepository $roleRepository,
        UserRoleRepository $userRoleRepository
    ) {
        $this->roleRepository = $roleRepository;
        $this->userRoleRepository = $userRoleRepository;
    }

    public function assignRole(int $userId, string $roleSlug, int $companyId, ?string $resourceType = null, ?int $resourceId = null): void
    {
        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $role = $this->roleRepository->findBy('slug', $roleSlug);
        
        if (!$role) {
            throw new ClientErrorException('Failed to assign role. Role not found.');
        }

        $this->userRoleRepository->create([
            'user_id' => $userId,
            'role_id' => $role->id,
            'company_id' => $companyId,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
        ]);
    }

    public function removeRole(int $userId, string $roleSlug, ?string $resourceType = null, ?int $resourceId = null): void
    {
        $role = $this->roleRepository->findBy('slug', $roleSlug);
        
        if (!$role) {
            throw new ClientErrorException('Failed to remove role. Role not found.');
        }

        $conditions = [
            'user_id' => $userId,
            'role_id' => $role->id,
        ];

        if ($resourceType) {
            $conditions['resource_type'] = $resourceType;
        }

        if ($resourceId) {
            $conditions['resource_id'] = $resourceId;
        }

        $userRole = $this->userRoleRepository->findOne($conditions);
        
        if (!$userRole) {
            throw new ClientErrorException('Failed to remove role. Role assignment not found.');
        }

        $this->userRoleRepository->delete($userRole->id);
    }

    public function getUserRoles(int $userId, ?int $companyId = null): array
    {
        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $conditions = ['user_id' => $userId];
        
        if ($companyId) {
            $conditions['company_id'] = $companyId;
        }

        $userRoles = $this->userRoleRepository->findAll($conditions, ['role']);

        return $userRoles->map(function ($userRole) {
            return [
                'id' => $userRole->id,
                'user_id' => $userRole->user_id,
                'role_id' => $userRole->role_id,
                'role' => [
                    'id' => $userRole->role->id,
                    'name' => $userRole->role->name,
                    'slug' => $userRole->role->slug,
                    'description' => $userRole->role->description,
                ],
                'resource_type' => $userRole->resource_type,
                'resource_id' => $userRole->resource_id,
                'company_id' => $userRole->company_id,
            ];
        })->toArray();
    }

    public function getAllRoles(): array
    {
        $roles = $this->roleRepository->findAll([], ['permissions']);

        return $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'permissions' => $role->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }
}

