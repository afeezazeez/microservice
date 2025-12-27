<?php

namespace Tests\Unit;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use App\Repositories\PermissionRepository;
use App\Repositories\UserRepository;
use App\Repositories\UserRoleRepository;
use App\Services\PermissionService;
use Illuminate\Database\Eloquent\Collection;
use Mockery;
use Tests\TestCase;

class PermissionServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_check_permission_returns_true_when_user_has_permission(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);
        $permissionRepo = Mockery::mock(PermissionRepository::class);

        $user = new User();
        $user->id = 1;
        $user->company_id = 1;
        
        $permission = new Permission();
        $permission->id = 1;
        $permission->slug = 'user:create';
        
        $role = new Role();
        $role->id = 1;
        $rolePermission = (object)['slug' => 'user:create'];
        $role->setRelation('permissions', collect([$rolePermission]));

        $userRole = new UserRole();
        $userRole->id = 1;
        $userRole->user_id = 1;
        $userRole->role_id = 1;
        $userRole->company_id = 1;
        $userRole->setRelation('role', $role);

        $userRepo->shouldReceive('findById')
            ->once()
            ->with(1)
            ->andReturn($user);

        $permissionRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'user:create')
            ->andReturn($permission);

        $userRoleRepo->shouldReceive('findAll')
            ->once()
            ->with(['user_id' => 1, 'company_id' => 1], ['role.permissions'])
            ->andReturn(new Collection([$userRole]));

        $permissionService = new PermissionService($userRepo, $userRoleRepo, $permissionRepo);

        $result = $permissionService->checkPermission(1, 'user:create', 1);

        $this->assertTrue($result);
    }

    public function test_check_permission_returns_false_when_user_not_found(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);
        $permissionRepo = Mockery::mock(PermissionRepository::class);

        $userRepo->shouldReceive('findById')
            ->once()
            ->with(999)
            ->andReturn(null);

        $permissionService = new PermissionService($userRepo, $userRoleRepo, $permissionRepo);

        $result = $permissionService->checkPermission(999, 'user:create', 1);

        $this->assertFalse($result);
    }

    public function test_check_permission_returns_false_when_permission_not_found(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);
        $permissionRepo = Mockery::mock(PermissionRepository::class);

        $user = new User();
        $user->id = 1;
        $user->company_id = 1;

        $userRepo->shouldReceive('findById')
            ->once()
            ->with(1)
            ->andReturn($user);

        $permissionRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'nonexistent:permission')
            ->andReturn(null);

        $permissionService = new PermissionService($userRepo, $userRoleRepo, $permissionRepo);

        $result = $permissionService->checkPermission(1, 'nonexistent:permission', 1);

        $this->assertFalse($result);
    }

    public function test_check_permission_returns_false_when_user_lacks_permission(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);
        $permissionRepo = Mockery::mock(PermissionRepository::class);

        $user = new User();
        $user->id = 1;
        $user->company_id = 1;
        $permission = new Permission();
        $permission->id = 1;
        $permission->slug = 'user:create';
        
        $role = new Role();
        $role->id = 1;
        $rolePermission = (object)['slug' => 'user:update']; // Different permission
        $role->setRelation('permissions', collect([$rolePermission]));

        $userRole = new UserRole();
        $userRole->id = 1;
        $userRole->user_id = 1;
        $userRole->role_id = 1;
        $userRole->company_id = 1;
        $userRole->setRelation('role', $role);

        $userRepo->shouldReceive('findById')
            ->once()
            ->with(1)
            ->andReturn($user);

        $permissionRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'user:create')
            ->andReturn($permission);

        $userRoleRepo->shouldReceive('findAll')
            ->once()
            ->with(['user_id' => 1, 'company_id' => 1], ['role.permissions'])
            ->andReturn(new Collection([$userRole]));

        $permissionService = new PermissionService($userRepo, $userRoleRepo, $permissionRepo);

        $result = $permissionService->checkPermission(1, 'user:create', 1);

        $this->assertFalse($result);
    }

    public function test_check_permissions_returns_array_of_results(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);
        $permissionRepo = Mockery::mock(PermissionRepository::class);

        $user = new User();
        $user->id = 1;
        $user->company_id = 1;
        $permission1 = new Permission(['id' => 1, 'slug' => 'user:create']);
        $permission2 = new Permission(['id' => 2, 'slug' => 'user:update']);
        
        $role = new Role();
        $role->id = 1;
        $rolePermission1 = (object)['slug' => 'user:create'];
        $rolePermission2 = (object)['slug' => 'user:update'];
        $role->setRelation('permissions', collect([$rolePermission1, $rolePermission2]));

        $userRole = new UserRole();
        $userRole->id = 1;
        $userRole->user_id = 1;
        $userRole->role_id = 1;
        $userRole->company_id = 1;
        $userRole->setRelation('role', $role);

        $userRepo->shouldReceive('findById')
            ->times(2)
            ->with(1)
            ->andReturn($user);

        $permissionRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'user:create')
            ->andReturn($permission1);

        $permissionRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'user:update')
            ->andReturn($permission2);

        $userRoleRepo->shouldReceive('findAll')
            ->times(2)
            ->with(['user_id' => 1, 'company_id' => 1], ['role.permissions'])
            ->andReturn(new Collection([$userRole]));

        $permissionService = new PermissionService($userRepo, $userRoleRepo, $permissionRepo);

        $result = $permissionService->checkPermissions(1, ['user:create', 'user:update'], 1);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('user:create', $result);
        $this->assertArrayHasKey('user:update', $result);
        $this->assertTrue($result['user:create']);
        $this->assertTrue($result['user:update']);
    }

    public function test_check_permission_filters_by_resource_type_and_id(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);
        $permissionRepo = Mockery::mock(PermissionRepository::class);

        $user = new User();
        $user->id = 1;
        $user->company_id = 1;
        $permission = new Permission();
        $permission->id = 1;
        $permission->slug = 'project:update';
        
        $role = new Role();
        $role->id = 1;
        $rolePermission = (object)['slug' => 'project:update'];
        $role->setRelation('permissions', collect([$rolePermission]));

        // Global role (no resource)
        $globalUserRole = new UserRole();
        $globalUserRole->id = 1;
        $globalUserRole->user_id = 1;
        $globalUserRole->role_id = 1;
        $globalUserRole->company_id = 1;
        $globalUserRole->resource_type = null;
        $globalUserRole->resource_id = null;
        $globalUserRole->setRelation('role', $role);

        // Resource-specific role
        $resourceUserRole = new UserRole();
        $resourceUserRole->id = 2;
        $resourceUserRole->user_id = 1;
        $resourceUserRole->role_id = 1;
        $resourceUserRole->company_id = 1;
        $resourceUserRole->resource_type = 'project';
        $resourceUserRole->resource_id = 123;
        $resourceUserRole->setRelation('role', $role);

        $userRepo->shouldReceive('findById')
            ->times(2)
            ->with(1)
            ->andReturn($user);

        $permissionRepo->shouldReceive('findBy')
            ->times(2)
            ->with('slug', 'project:update')
            ->andReturn($permission);

        $userRoleRepo->shouldReceive('findAll')
            ->times(2)
            ->with(['user_id' => 1, 'company_id' => 1], ['role.permissions'])
            ->andReturn(new Collection([$globalUserRole, $resourceUserRole]));

        $permissionService = new PermissionService($userRepo, $userRoleRepo, $permissionRepo);

        // Should match global role
        $result = $permissionService->checkPermission(1, 'project:update', 1, 'project', 123);
        $this->assertTrue($result);

        // Should match resource-specific role
        $result2 = $permissionService->checkPermission(1, 'project:update', 1, 'project', 123);
        $this->assertTrue($result2);
    }
}
