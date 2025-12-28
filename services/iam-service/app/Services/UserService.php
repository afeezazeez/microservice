<?php

namespace App\Services;

use App\Exceptions\ClientErrorException;
use App\Repositories\UserRepository;
use App\Repositories\CompanyRepository;
use App\Repositories\RoleRepository;
use App\Services\RoleService;
use App\Services\RabbitMQService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserService
{
    private UserRepository $userRepository;
    private CompanyRepository $companyRepository;
    private RoleService $roleService;
    private RoleRepository $roleRepository;
    private RabbitMQService $rabbitMQService;

    public function __construct(
        UserRepository $userRepository,
        CompanyRepository $companyRepository,
        RoleService $roleService,
        RoleRepository $roleRepository,
        RabbitMQService $rabbitMQService
    ) {
        $this->userRepository = $userRepository;
        $this->companyRepository = $companyRepository;
        $this->roleService = $roleService;
        $this->roleRepository = $roleRepository;
        $this->rabbitMQService = $rabbitMQService;
    }

    public function listUsers(int $companyId, array $filters = []): array
    {
        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $conditions = array_merge(['company_id' => $companyId], $filters);
        $users = $this->userRepository->findAll($conditions, ['roles']);

        return $users->map(function ($user) use ($companyId) {
            $roles = $user->roles()
                ->where('user_roles.company_id', $companyId)
                ->whereNull('user_roles.resource_type')
                ->pluck('slug')
                ->toArray();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_id' => $user->company_id,
                'roles' => $roles,
            ];
        })->toArray();
    }

    public function getUserById(int $userId, int $companyId): array
    {
        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $user = $this->userRepository->findOne([
            'id' => $userId,
            'company_id' => $companyId,
        ]);

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_id' => $user->company_id,
        ];
    }

    public function updateUser(int $userId, int $companyId, array $data): array
    {
        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $user = $this->userRepository->findOne([
            'id' => $userId,
            'company_id' => $companyId,
        ]);

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

        $updateData = [];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }

        if (isset($data['email'])) {
            $updateData['email'] = $data['email'];
        }

        if (isset($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        if (empty($updateData)) {
            return $this->getUserById($userId, $companyId);
        }

        $this->userRepository->update($userId, $updateData);

        $updatedUser = $this->userRepository->findById($userId);

        // Publish user.updated event
        try {
            $this->rabbitMQService->publish(
                config('rabbitmq.exchanges.user_events'),
                'user.updated',
                [
                    'event' => 'user.updated',
                    'data' => [
                        'id' => $updatedUser->id,
                        'company_id' => $updatedUser->company_id,
                        'name' => $updatedUser->name,
                        'email' => $updatedUser->email,
                    ],
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to publish user.updated event to RabbitMQ: ' . $e->getMessage(), [
                'user_id' => $userId,
            ]);
        }

        return $this->getUserById($userId, $companyId);
    }

    public function deleteUser(int $userId, int $companyId): void
    {
        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $user = $this->userRepository->findOne([
            'id' => $userId,
            'company_id' => $companyId,
        ]);

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

        $userIdToDelete = $user->id;

        $this->userRepository->delete($userId);

        // Publish user.deleted event
        try {
            $this->rabbitMQService->publish(
                config('rabbitmq.exchanges.user_events'),
                'user.deleted',
                [
                    'event' => 'user.deleted',
                    'data' => [
                        'id' => $userIdToDelete,
                    ],
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to publish user.deleted event to RabbitMQ: ' . $e->getMessage(), [
                'user_id' => $userIdToDelete,
            ]);
        }
    }

    public function inviteUser(int $companyId, array $data): array
    {
        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $company = $this->companyRepository->findById($companyId);
        if (!$company) {
            throw new ClientErrorException('Company not found');
        }

        $existingUser = $this->userRepository->findOne(['email' => $data['email']]);
        if ($existingUser) {
            throw new ClientErrorException('User with this email already exists');
        }

        $user = $this->userRepository->create([
            'company_id' => $companyId,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['email']),
        ]);

        $roleSlug = null;
        $roleName = null;
        if (isset($data['role_slug'])) {
            $roleSlug = $data['role_slug'];
            $this->roleService->assignRole(
                $user->id,
                $roleSlug,
                $companyId,
                $data['resource_type'] ?? null,
                $data['resource_id'] ?? null
            );
            
            $role = $this->roleRepository->findBy('slug', $roleSlug);
            if ($role) {
                $roleName = $role->name;
            }
        }

        // Publish user.created event (invited user is also created)
        try {
            $this->rabbitMQService->publish(
                config('rabbitmq.exchanges.user_events'),
                'user.created',
                [
                    'event' => 'user.created',
                    'data' => [
                        'id' => $user->id,
                        'company_id' => $user->company_id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to publish user.created event to RabbitMQ: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);
        }

        // Also publish user.invited event for notification purposes
        try {
            $this->rabbitMQService->publish(
                config('rabbitmq.exchanges.user_events'),
                'user.invited',
                [
                    'event' => 'user.invited',
                    'data' => [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'user_name' => $user->name,
                        'company_name' => $company->name,
                        'role_name' => $roleName ?? '',
                    ],
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to publish user.invited event to RabbitMQ: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_id' => $user->company_id,
        ];
    }
}

