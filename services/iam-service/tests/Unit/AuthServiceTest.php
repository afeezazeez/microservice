<?php

namespace Tests\Unit;

use App\Exceptions\ClientErrorException;
use App\Models\Company;
use App\Models\User;
use App\Repositories\CompanyRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\JWTService;
use App\Services\RoleService;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_register_company_creates_company_and_user_with_role(): void
    {
       
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $company = new Company();
        $company->id = 1;
        $company->name = 'Test Company';
        $company->identifier = 'test123';
        
        $user = new User();
        $user->id = 1;
        $user->name = 'Test User';
        $user->email = 'user@test.com';
        $user->company_id = 1;
        $token = 'mock-jwt-token';

        $companyRepo->shouldReceive('findBy')
            ->with('identifier', Mockery::type('string'))
            ->andReturn(null); // No existing identifier

        $companyRepo->shouldReceive('create')
            ->once()
            ->andReturn($company);

        $userRepo->shouldReceive('create')
            ->once()
            ->andReturn($user);

        $roleService->shouldReceive('assignRole')
            ->once()
            ->with($user->id, 'super-admin', $company->id);

        $accessToken = 'mock-access-token';
        $refreshToken = 'mock-refresh-token';

        $jwtService->shouldReceive('generateAccessToken')
            ->once()
            ->with($user)
            ->andReturn($accessToken);

        $jwtService->shouldReceive('generateRefreshToken')
            ->once()
            ->with($user)
            ->andReturn($refreshToken);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $result = $authService->registerCompany(
            ['name' => 'Test Company', 'email' => 'test@company.com', 'phone' => null, 'address' => null],
            ['name' => 'Test User', 'email' => 'user@test.com', 'password' => 'password123']
        );

        $this->assertIsArray($result);
        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('company', $result);
        $this->assertArrayHasKey('access_token', $result);
        $this->assertArrayHasKey('refresh_token', $result);
        $this->assertEquals($accessToken, $result['access_token']);
        $this->assertEquals($refreshToken, $result['refresh_token']);
        $this->assertEquals($user->id, $result['user']['id']);
        $this->assertEquals($company->id, $result['company']['id']);
    }

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $company = new Company();
        $company->id = 1;
        $company->name = 'Test Company';

        $user = Mockery::mock(User::class)->makePartial()->shouldAllowMockingProtectedMethods();
        $user->id = 1;
        $user->email = 'test@example.com';
        $user->password = Hash::make('password123');
        $user->company_id = 1;
        $user->name = 'Test User';
        $token = 'mock-jwt-token';

        $user->shouldReceive('load')
            ->with('company')
            ->andReturnSelf();

        $user->shouldReceive('relationLoaded')
            ->with('company')
            ->andReturn(false);

        $user->shouldReceive('getAttribute')
            ->with('company')
            ->andReturn($company);

        $rolesQuery = Mockery::mock();
        $rolesQuery->shouldReceive('where')
            ->with('user_roles.company_id', 1)
            ->andReturnSelf();
        $rolesQuery->shouldReceive('whereNull')
            ->with('user_roles.resource_type')
            ->andReturnSelf();
        $rolesQuery->shouldReceive('pluck')
            ->with('slug')
            ->andReturn(collect(['admin']));

        $user->shouldReceive('roles')
            ->andReturn($rolesQuery);

        $userRepo->shouldReceive('findBy')
            ->with('email', 'test@example.com')
            ->once()
            ->andReturn($user);

        $accessToken = 'mock-access-token';
        $refreshToken = 'mock-refresh-token';

        $jwtService->shouldReceive('generateAccessToken')
            ->once()
            ->with($user)
            ->andReturn($accessToken);

        $jwtService->shouldReceive('generateRefreshToken')
            ->once()
            ->with($user)
            ->andReturn($refreshToken);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $result = $authService->login('test@example.com', 'password123');

        $this->assertIsArray($result);
        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('access_token', $result);
        $this->assertArrayHasKey('refresh_token', $result);
        $this->assertEquals($accessToken, $result['access_token']);
        $this->assertEquals($refreshToken, $result['refresh_token']);
        $this->assertIsString($result['access_token']);
        $this->assertNotEmpty($result['access_token']);
        $this->assertArrayHasKey('company_name', $result['user']);
        $this->assertArrayHasKey('roles', $result['user']);
    }

    public function test_login_throws_exception_when_user_not_found(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $userRepo->shouldReceive('findBy')
            ->with('email', 'nonexistent@example.com')
            ->once()
            ->andReturn(null);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Invalid credentials');

        $authService->login('nonexistent@example.com', 'password123');
    }

    public function test_login_throws_exception_for_invalid_password(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $user = new User();
        $user->id = 1;
        $user->email = 'test@example.com';
        $user->password = Hash::make('correctpassword');
        $user->company_id = 1;

        $userRepo->shouldReceive('findBy')
            ->with('email', 'test@example.com')
            ->once()
            ->andReturn($user);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Invalid credentials');

        $authService->login('test@example.com', 'wrongpassword');
    }

    public function test_register_user_creates_user_with_role(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $user = new User();
        $user->id = 1;
        $user->name = 'New User';
        $user->email = 'new@test.com';
        $user->company_id = 1;
        $token = 'mock-jwt-token';

        $userRepo->shouldReceive('create')
            ->once()
            ->andReturn($user);

        $roleService->shouldReceive('assignRole')
            ->once()
            ->with($user->id, 'project-manager', 1, null, null);

        $accessToken = 'mock-access-token';
        $refreshToken = 'mock-refresh-token';

        $jwtService->shouldReceive('generateAccessToken')
            ->once()
            ->with($user)
            ->andReturn($accessToken);

        $jwtService->shouldReceive('generateRefreshToken')
            ->once()
            ->with($user)
            ->andReturn($refreshToken);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $result = $authService->registerUser(
            ['name' => 'New User', 'email' => 'new@test.com', 'password' => 'password123', 'role_slug' => 'project-manager'],
            1
        );

        $this->assertIsArray($result);
        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('access_token', $result);
        $this->assertArrayHasKey('refresh_token', $result);
        $this->assertEquals($accessToken, $result['access_token']);
        $this->assertEquals($refreshToken, $result['refresh_token']);
    }

    public function test_refresh_access_token_returns_new_access_token(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $refreshToken = 'refresh-token';
        $newAccessToken = 'new-access-token';

        $jwtService->shouldReceive('refreshAccessToken')
            ->once()
            ->with($refreshToken)
            ->andReturn($newAccessToken);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $result = $authService->refreshAccessToken($refreshToken);

        $this->assertEquals($newAccessToken, $result);
        $this->assertIsString($result);
    }

    public function test_refresh_access_token_throws_exception_for_invalid_token(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $jwtService->shouldReceive('refreshAccessToken')
            ->once()
            ->with('invalid-refresh-token')
            ->andReturn(null);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Invalid or expired refresh token');

        $authService->refreshAccessToken('invalid-refresh-token');
    }

    public function test_logout_blacklists_token(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $token = 'token-to-blacklist';

        $jwtService->shouldReceive('blacklistToken')
            ->once()
            ->with($token)
            ->andReturn(true);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $authService->logout($token);

        $this->assertTrue(true);
    }

    public function test_logout_throws_exception_when_token_not_provided(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Token not provided');

        $authService->logout(null);
    }

    public function test_get_authenticated_user_returns_user_data(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $user = new User();
        $user->id = 1;
        $user->name = 'Test User';
        $user->email = 'test@example.com';
        $user->company_id = 1;
        
        $company = new Company();
        $company->id = 1;
        $company->name = 'Test Company';
        $company->identifier = 'test123';

        $userRepo->shouldReceive('findById')
            ->once()
            ->with(1)
            ->andReturn($user);

        $companyRepo->shouldReceive('findById')
            ->once()
            ->with(1)
            ->andReturn($company);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $result = $authService->getAuthenticatedUser(1);

        $this->assertIsArray($result);
        $this->assertEquals($user->id, $result['id']);
        $this->assertEquals($user->email, $result['email']);
        $this->assertArrayHasKey('company', $result);
        $this->assertEquals($company->id, $result['company']['id']);
    }

    public function test_get_authenticated_user_throws_exception_when_user_not_found(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);
        $roleService = Mockery::mock(RoleService::class);
        $jwtService = Mockery::mock(JWTService::class);

        $userRepo->shouldReceive('findById')
            ->once()
            ->with(999)
            ->andReturn(null);

        $authService = new AuthService($userRepo, $companyRepo, $roleService, $jwtService);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('User not found');

        $authService->getAuthenticatedUser(999);
    }
}
