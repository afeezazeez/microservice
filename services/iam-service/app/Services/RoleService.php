<?php

namespace App\Services;

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

    public function assignRole(int $userId, string $roleSlug, int $companyId, ?string $resourceType = null, ?int $resourceId = null): bool
    {
        $role = $this->roleRepository->findBy('slug', $roleSlug);
        
        if (!$role) {
            return false;
        }

        $this->userRoleRepository->create([
            'user_id' => $userId,
            'role_id' => $role->id,
            'company_id' => $companyId,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
        ]);

        return true;
    }

    public function removeRole(int $userId, string $roleSlug, ?string $resourceType = null, ?int $resourceId = null): bool
    {
        $role = $this->roleRepository->findBy('slug', $roleSlug);
        
        if (!$role) {
            return false;
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
            return false;
        }

        return $this->userRoleRepository->delete($userRole->id);
    }

    public function getUserRoles(int $userId, ?int $companyId = null): array
    {
        $conditions = ['user_id' => $userId];
        
        if ($companyId) {
            $conditions['company_id'] = $companyId;
        }

        return $this->userRoleRepository->findAll($conditions, ['role', 'company'])->toArray();
    }
}

