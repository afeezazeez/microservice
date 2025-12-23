<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use App\Services\JWTService;
use Illuminate\Support\Facades\Hash;
use Tests\FeatureTestCase;

class RoleTest extends FeatureTestCase
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

    public function test_list_roles_returns_all_roles_with_permissions(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'description',
                        'permissions' => [
                            '*' => ['id', 'name', 'slug'],
                        ],
                    ],
                ],
            ]);
    }

    public function test_get_user_roles_returns_user_roles(): void
    {
        $targetUser = User::factory()->create([
            'company_id' => $this->company->id,
        ]);

        $role = Role::where('slug', 'project-manager')->first();
        UserRole::factory()->create([
            'user_id' => $targetUser->id,
            'role_id' => $role->id,
            'company_id' => $this->company->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/roles/user/{$targetUser->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'role_id',
                        'company_id',
                        'role',
                    ],
                ],
            ]);
    }

    public function test_assign_role_creates_user_role(): void
    {
        $targetUser = User::factory()->create([
            'company_id' => $this->company->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/roles/assign', [
                'user_id' => $targetUser->id,
                'role_slug' => 'project-manager',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('user_roles', [
            'user_id' => $targetUser->id,
            'company_id' => $this->company->id,
        ]);
    }

    public function test_remove_role_deletes_user_role(): void
    {
        $targetUser = User::factory()->create([
            'company_id' => $this->company->id,
        ]);

        $role = Role::where('slug', 'project-manager')->first();
        UserRole::factory()->create([
            'user_id' => $targetUser->id,
            'role_id' => $role->id,
            'company_id' => $this->company->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/roles/remove', [
                'user_id' => $targetUser->id,
                'role_slug' => 'project-manager',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('user_roles', [
            'user_id' => $targetUser->id,
            'role_id' => $role->id,
            'company_id' => $this->company->id,
        ]);
    }

    protected function getJwtToken(User $user): string
    {
        $jwtService = app(JWTService::class);
        return $jwtService->generateToken($user);
    }
}

