<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use App\Services\JWTService;
use Illuminate\Support\Facades\Hash;
use Tests\FeatureTestCase;

class UserTest extends FeatureTestCase
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

    public function test_list_users_returns_users_in_company(): void
    {
        User::factory()->count(3)->create([
            'company_id' => $this->company->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'email', 'company_id'],
                ],
            ]);

        $this->assertGreaterThanOrEqual(4, count($response->json('data')));
    }

    public function test_get_user_returns_user_details(): void
    {
        $otherUser = User::factory()->create([
            'company_id' => $this->company->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/users/{$otherUser->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['id', 'name', 'email', 'company_id'],
            ])
            ->assertJson([
                'data' => [
                    'id' => $otherUser->id,
                    'email' => $otherUser->email,
                ],
            ]);
    }

    public function test_get_user_fails_for_user_from_different_company(): void
    {
        $otherCompany = Company::factory()->create();
        $otherUser = User::factory()->create([
            'company_id' => $otherCompany->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/users/{$otherUser->id}");

        $response->assertStatus(400);
    }

    public function test_update_user_updates_user_details(): void
    {
        $otherUser = User::factory()->create([
            'company_id' => $this->company->id,
            'name' => 'Old Name',
            'email' => 'old@example.com',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/users/{$otherUser->id}", [
                'name' => 'New Name',
                'email' => 'new@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'name' => 'New Name',
                    'email' => 'new@example.com',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $otherUser->id,
            'name' => 'New Name',
            'email' => 'new@example.com',
        ]);
    }

    public function test_delete_user_removes_user(): void
    {
        $otherUser = User::factory()->create([
            'company_id' => $this->company->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/users/{$otherUser->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('users', [
            'id' => $otherUser->id,
        ]);
    }

    protected function getJwtToken(User $user): string
    {
        $jwtService = app(JWTService::class);
        return $jwtService->generateAccessToken($user);
    }
}

