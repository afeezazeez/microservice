<?php

namespace Tests\Unit;

use App\Exceptions\ClientErrorException;
use App\Models\Role;
use App\Models\UserRole;
use App\Repositories\RoleRepository;
use App\Repositories\UserRoleRepository;
use App\Services\RoleService;
use Illuminate\Database\Eloquent\Collection;
use Mockery;
use Tests\TestCase;

class RoleServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_assign_role_creates_user_role(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $role = new Role();
        $role->id = 1;
        $role->slug = 'project-manager';
        $role->name = 'Project Manager';

        $roleRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'project-manager')
            ->andReturn($role);

        $userRoleRepo->shouldReceive('create')
            ->once()
            ->with([
                'user_id' => 1,
                'role_id' => 1,
                'company_id' => 1,
                'resource_type' => null,
                'resource_id' => null,
            ]);

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $roleService->assignRole(1, 'project-manager', 1);

        // No exception means success
        $this->assertTrue(true);
    }

    public function test_assign_role_throws_exception_when_role_not_found(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $roleRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'nonexistent-role')
            ->andReturn(null);

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Failed to assign role. Role not found.');

        $roleService->assignRole(1, 'nonexistent-role', 1);
    }

    public function test_assign_role_throws_exception_when_company_id_missing(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Company ID not found');

        $roleService->assignRole(1, 'project-manager', 0);
    }

    public function test_remove_role_deletes_user_role(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $role = new Role();
        $role->id = 1;
        $role->slug = 'project-manager';
        
        $userRole = new UserRole();
        $userRole->id = 1;
        $userRole->user_id = 1;
        $userRole->role_id = 1;

        $roleRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'project-manager')
            ->andReturn($role);

        $userRoleRepo->shouldReceive('findOne')
            ->once()
            ->with(['user_id' => 1, 'role_id' => 1])
            ->andReturn($userRole);

        $userRoleRepo->shouldReceive('delete')
            ->once()
            ->with(1);

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $roleService->removeRole(1, 'project-manager');

        // No exception means success
        $this->assertTrue(true);
    }

    public function test_remove_role_throws_exception_when_role_not_found(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $roleRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'nonexistent-role')
            ->andReturn(null);

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Failed to remove role. Role not found.');

        $roleService->removeRole(1, 'nonexistent-role');
    }

    public function test_remove_role_throws_exception_when_assignment_not_found(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $role = new Role();
        $role->id = 1;
        $role->slug = 'project-manager';

        $roleRepo->shouldReceive('findBy')
            ->once()
            ->with('slug', 'project-manager')
            ->andReturn($role);

        $userRoleRepo->shouldReceive('findOne')
            ->once()
            ->with(['user_id' => 1, 'role_id' => 1])
            ->andReturn(null);

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Failed to remove role. Role assignment not found.');

        $roleService->removeRole(1, 'project-manager');
    }

    public function test_get_user_roles_returns_formatted_roles(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $role = new Role();
        $role->id = 1;
        $role->name = 'Project Manager';
        $role->slug = 'project-manager';
        $role->description = 'Manages projects';
        
        $userRole = new UserRole();
        $userRole->id = 1;
        $userRole->user_id = 1;
        $userRole->role_id = 1;
        $userRole->company_id = 1;
        $userRole->resource_type = null;
        $userRole->resource_id = null;
        $userRole->setRelation('role', $role);

        $userRoleRepo->shouldReceive('findAll')
            ->once()
            ->with(['user_id' => 1, 'company_id' => 1], ['role'])
            ->andReturn(new Collection([$userRole]));

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $result = $roleService->getUserRoles(1, 1);

        $this->assertIsArray($result);
        $this->assertCount(1, $result);
        $this->assertArrayHasKey('role', $result[0]);
        $this->assertEquals('project-manager', $result[0]['role']['slug']);
    }

    public function test_get_user_roles_throws_exception_when_company_id_missing(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Company ID not found');

        $roleService->getUserRoles(1, 0);
    }

    public function test_get_all_roles_returns_roles_with_permissions(): void
    {
        $roleRepo = Mockery::mock(RoleRepository::class);
        $userRoleRepo = Mockery::mock(UserRoleRepository::class);

        $permission1 = (object)['id' => 1, 'name' => 'Create User', 'slug' => 'user:create'];
        $permission2 = (object)['id' => 2, 'name' => 'Update User', 'slug' => 'user:update'];
        
        $role = new Role();
        $role->id = 1;
        $role->name = 'Admin';
        $role->slug = 'admin';
        $role->description = 'Admin role';
        $role->setRelation('permissions', collect([$permission1, $permission2]));

        $roleRepo->shouldReceive('findAll')
            ->once()
            ->with([], ['permissions'])
            ->andReturn(new Collection([$role]));

        $roleService = new RoleService($roleRepo, $userRoleRepo);

        $result = $roleService->getAllRoles();

        $this->assertIsArray($result);
        $this->assertCount(1, $result);
        $this->assertArrayHasKey('permissions', $result[0]);
        $this->assertCount(2, $result[0]['permissions']);
    }
}
