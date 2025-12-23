<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use App\Services\JWTService;
use Illuminate\Support\Facades\Hash;
use Tests\FeatureTestCase;

class PermissionTest extends FeatureTestCase
{

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::factory()->create();
        $this->user = User::factory()->create([
            'company_id' => $this->company->id,
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
        ]);
        $this->token = $this->getJwtToken($this->user);
    }

    public function test_check_permission_returns_true_when_user_has_permission(): void
    {
        $role = Role::where('slug', 'super-admin')->first();
        UserRole::factory()->create([
            'user_id' => $this->user->id,
            'role_id' => $role->id,
            'company_id' => $this->company->id,
        ]);

        $permission = Permission::where('slug', 'user:create')->first();
        
        $this->assertNotNull($permission, 'Permission user:create should be seeded');

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/permissions/check', [
                'permission_slug' => $permission->slug,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['allowed'],
            ])
            ->assertJson([
                'data' => ['allowed' => true],
            ]);
    }

    public function test_check_permission_returns_false_when_user_lacks_permission(): void
    {
        $permission = Permission::where('slug', 'user:create')->first();
        
        // Ensure permission exists (seeded)
        $this->assertNotNull($permission, 'Permission user:create should be seeded');

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/permissions/check', [
                'permission_slug' => $permission->slug,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => ['allowed' => false],
            ]);
    }

    public function test_check_permissions_batch_returns_multiple_results(): void
    {
        $role = Role::where('slug', 'super-admin')->first();
        UserRole::factory()->create([
            'user_id' => $this->user->id,
            'role_id' => $role->id,
            'company_id' => $this->company->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/permissions/check-batch', [
                'permission_slugs' => ['user:create', 'user:update', 'user:delete'],
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user:create',
                    'user:update',
                    'user:delete',
                ],
            ]);
    }

    protected function getJwtToken(User $user): string
    {
        $jwtService = app(JWTService::class);
        return $jwtService->generateToken($user);
    }
}

