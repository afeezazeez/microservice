<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use App\Services\JWTService;
use Illuminate\Support\Facades\Hash;
use Tests\FeatureTestCase;

class AuthTest extends FeatureTestCase
{

    public function test_register_company_creates_company_and_admin_user(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'company' => [
                'name' => 'Acme Corp',
                'email' => 'contact@acme.com',
                'phone' => '+1234567890',
                'address' => '123 Main St',
            ],
            'user' => [
                'name' => 'Admin User',
                'email' => 'admin@acme.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'company_id'],
                    'company' => ['id', 'name', 'identifier', 'email'],
                    'access_token',
                    'refresh_token',
                ],
            ]);

        $this->assertDatabaseHas('companies', [
            'name' => 'Acme Corp',
            'email' => 'contact@acme.com',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@acme.com',
        ]);
    }

    public function test_register_company_validates_required_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'error',
                'error_message',
                'errors',
            ]);
    }

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->create([
            'company_id' => $company->id,
            'email' => 'user@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'company_id'],
                    'access_token',
                    'refresh_token',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.access_token'));
        $this->assertNotEmpty($response->json('data.refresh_token'));
    }

    public function test_login_fails_for_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'Invalid credentials',
            ]);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->create([
            'company_id' => $company->id,
            'email' => 'user@example.com',
            'password' => Hash::make('password123'),
        ]);

        $token = $this->getJwtToken($user);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'company_id',
                    'company',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ]);
    }

    public function test_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_logout_blacklists_token(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->create([
            'company_id' => $company->id,
            'email' => 'user@example.com',
            'password' => Hash::make('password123'),
        ]);

        $token = $this->getJwtToken($user);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Token should be blacklisted - subsequent request should fail
        $response2 = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/auth/me');

        $response2->assertStatus(401);
    }

    public function test_refresh_token_returns_new_access_token(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->create([
            'company_id' => $company->id,
            'email' => 'user@example.com',
            'password' => Hash::make('password123'),
        ]);

        $refreshToken = $this->getRefreshToken($user);

        $response = $this->postJson('/api/auth/refresh', [
            'refresh_token' => $refreshToken,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['access_token'],
            ]);

        $newAccessToken = $response->json('data.access_token');
        $this->assertNotEmpty($newAccessToken);
    }

    protected function getJwtToken(User $user): string
    {
        $jwtService = app(JWTService::class);
        return $jwtService->generateAccessToken($user);
    }

    protected function getRefreshToken(User $user): string
    {
        $jwtService = app(JWTService::class);
        return $jwtService->generateRefreshToken($user);
    }
}

