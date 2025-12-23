<?php

namespace Tests\Unit;

use App\Exceptions\ClientErrorException;
use App\Models\User;
use App\Repositories\CompanyRepository;
use App\Repositories\UserRepository;
use App\Services\UserService;
use Illuminate\Database\Eloquent\Collection;
use Mockery;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_list_users_returns_formatted_users(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $user1 = new User();
        $user1->id = 1;
        $user1->name = 'User 1';
        $user1->email = 'user1@test.com';
        $user1->company_id = 1;
        
        $user2 = new User();
        $user2->id = 2;
        $user2->name = 'User 2';
        $user2->email = 'user2@test.com';
        $user2->company_id = 1;
        
        $users = new Collection([$user1, $user2]);

        $userRepo->shouldReceive('findAll')
            ->once()
            ->with(['company_id' => 1])
            ->andReturn($users);

        $userService = new UserService($userRepo, $companyRepo);

        $result = $userService->listUsers(1);

        $this->assertIsArray($result);
        $this->assertCount(2, $result);
        $this->assertEquals('User 1', $result[0]['name']);
        $this->assertArrayHasKey('id', $result[0]);
        $this->assertArrayHasKey('email', $result[0]);
        $this->assertArrayHasKey('company_id', $result[0]);
    }

    public function test_list_users_throws_exception_when_company_id_missing(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $userService = new UserService($userRepo, $companyRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Company ID not found');

        $userService->listUsers(0);
    }

    public function test_get_user_by_id_returns_formatted_user(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $user = new User();
        $user->id = 1;
        $user->name = 'Test User';
        $user->email = 'test@example.com';
        $user->company_id = 1;

        $userRepo->shouldReceive('findOne')
            ->once()
            ->with(['id' => 1, 'company_id' => 1])
            ->andReturn($user);

        $userService = new UserService($userRepo, $companyRepo);

        $result = $userService->getUserById(1, 1);

        $this->assertIsArray($result);
        $this->assertEquals(1, $result['id']);
        $this->assertEquals('Test User', $result['name']);
        $this->assertEquals('test@example.com', $result['email']);
    }

    public function test_get_user_by_id_throws_exception_when_user_not_found(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $userRepo->shouldReceive('findOne')
            ->once()
            ->with(['id' => 999, 'company_id' => 1])
            ->andReturn(null);

        $userService = new UserService($userRepo, $companyRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('User not found');

        $userService->getUserById(999, 1);
    }

    public function test_get_user_by_id_throws_exception_when_company_id_missing(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $userService = new UserService($userRepo, $companyRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Company ID not found');

        $userService->getUserById(1, 0);
    }

    public function test_update_user_updates_user_details(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $user = new User();
        $user->id = 1;
        $user->name = 'Old Name';
        $user->email = 'old@test.com';
        $user->company_id = 1;
        
        $updatedUser = new User();
        $updatedUser->id = 1;
        $updatedUser->name = 'New Name';
        $updatedUser->email = 'old@test.com';
        $updatedUser->company_id = 1;

        $userRepo->shouldReceive('findOne')
            ->twice()
            ->with(['id' => 1, 'company_id' => 1])
            ->andReturn($user, $updatedUser);

        $userRepo->shouldReceive('update')
            ->once()
            ->with(1, ['name' => 'New Name']);

        $userService = new UserService($userRepo, $companyRepo);

        $result = $userService->updateUser(1, 1, ['name' => 'New Name']);

        $this->assertEquals('New Name', $result['name']);
    }

    public function test_update_user_hashes_password(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $user = new User();
        $user->id = 1;
        $user->name = 'Test';
        $user->email = 'test@test.com';
        $user->company_id = 1;
        
        $updatedUser = new User();
        $updatedUser->id = 1;
        $updatedUser->name = 'Test';
        $updatedUser->email = 'test@test.com';
        $updatedUser->company_id = 1;

        $userRepo->shouldReceive('findOne')
            ->twice()
            ->with(['id' => 1, 'company_id' => 1])
            ->andReturn($user, $updatedUser);

        $userRepo->shouldReceive('update')
            ->once()
            ->with(1, Mockery::on(function ($data) {
                return isset($data['password']) && password_verify('newpassword', $data['password']);
            }));

        $userService = new UserService($userRepo, $companyRepo);

        $result = $userService->updateUser(1, 1, ['password' => 'newpassword']);

        $this->assertIsArray($result);
    }

    public function test_update_user_throws_exception_when_user_not_found(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $userRepo->shouldReceive('findOne')
            ->once()
            ->with(['id' => 999, 'company_id' => 1])
            ->andReturn(null);

        $userService = new UserService($userRepo, $companyRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('User not found');

        $userService->updateUser(999, 1, ['name' => 'New Name']);
    }

    public function test_delete_user_calls_repository_delete(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $user = new User();
        $user->id = 1;
        $user->company_id = 1;

        $userRepo->shouldReceive('findOne')
            ->once()
            ->with(['id' => 1, 'company_id' => 1])
            ->andReturn($user);

        $userRepo->shouldReceive('delete')
            ->once()
            ->with(1);

        $userService = new UserService($userRepo, $companyRepo);

        $userService->deleteUser(1, 1);

        // No exception means success
        $this->assertTrue(true);
    }

    public function test_delete_user_throws_exception_when_user_not_found(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $userRepo->shouldReceive('findOne')
            ->once()
            ->with(['id' => 999, 'company_id' => 1])
            ->andReturn(null);

        $userService = new UserService($userRepo, $companyRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('User not found');

        $userService->deleteUser(999, 1);
    }

    public function test_delete_user_throws_exception_when_company_id_missing(): void
    {
        $userRepo = Mockery::mock(UserRepository::class);
        $companyRepo = Mockery::mock(CompanyRepository::class);

        $userService = new UserService($userRepo, $companyRepo);

        $this->expectException(ClientErrorException::class);
        $this->expectExceptionMessage('Company ID not found');

        $userService->deleteUser(1, 0);
    }
}
