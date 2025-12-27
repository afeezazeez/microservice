<?php

namespace App\Services;

use App\Repositories\PermissionRepository;
use App\Repositories\UserRepository;
use App\Repositories\UserRoleRepository;
use Illuminate\Support\Collection;

class PermissionService
{
    private UserRepository $userRepository;
    private UserRoleRepository $userRoleRepository;
    private PermissionRepository $permissionRepository;

    public function __construct(
        UserRepository $userRepository,
        UserRoleRepository $userRoleRepository,
        PermissionRepository $permissionRepository
    ) {
        $this->userRepository = $userRepository;
        $this->userRoleRepository = $userRoleRepository;
        $this->permissionRepository = $permissionRepository;
    }

    public function checkPermission(int $userId, string $permissionSlug, int $companyId, ?string $resourceType = null, ?int $resourceId = null): bool
    {
        $user = $this->userRepository->findById($userId);
        
        if (!$user) {
            return false;
        }

        if ($user->company_id !== $companyId) {
            return false;
        }

        $permission = $this->permissionRepository->findBy('slug', $permissionSlug);
        
        if (!$permission) {
            return false;
        }

        $userRoles = $this->getRelevantUserRoles($userId, $companyId, $resourceType, $resourceId);

        $hasPermission = false;

        foreach ($userRoles as $userRole) {
            $role = $userRole->role;
            
            if (!$role) {
                continue;
            }

            $rolePermissions = $role->permissions;
            
            foreach ($rolePermissions as $rolePermission) {
                if ($rolePermission->slug === $permissionSlug) {
                    $hasPermission = true;
                    break 2;
                }
            }
        }

        return $hasPermission;
    }

    public function checkPermissions(int $userId, array $permissionSlugs, int $companyId, ?string $resourceType = null, ?int $resourceId = null): array
    {
        $results = [];
        
        foreach ($permissionSlugs as $permissionSlug) {
            $results[$permissionSlug] = $this->checkPermission($userId, $permissionSlug, $companyId, $resourceType, $resourceId);
        }

        return $results;
    }

    private function getRelevantUserRoles(int $userId, int $companyId, ?string $resourceType = null, ?int $resourceId = null): Collection
    {
        $conditions = [
            'user_id' => $userId,
            'company_id' => $companyId,
        ];

        $userRoles = $this->userRoleRepository->findAll($conditions, ['role.permissions']);

        if (!$resourceType && !$resourceId) {
            return $userRoles->filter(function ($userRole) {
                return $userRole->resource_type === null && $userRole->resource_id === null;
            });
        }

        return $userRoles->filter(function ($userRole) use ($resourceType, $resourceId) {
            $isGlobal = $userRole->resource_type === null && $userRole->resource_id === null;
            $isResourceMatch = $userRole->resource_type === $resourceType && $userRole->resource_id === $resourceId;
            
            return $isGlobal || $isResourceMatch;
        });
    }
}

