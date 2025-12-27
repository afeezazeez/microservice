<?php

namespace App\Services;

use App\Exceptions\ClientErrorException;
use App\Repositories\UserRepository;
use App\Repositories\CompanyRepository;
use App\Services\RoleService;
use Illuminate\Support\Facades\Hash;

class UserService
{
    private UserRepository $userRepository;
    private CompanyRepository $companyRepository;
    private RoleService $roleService;

    public function __construct(
        UserRepository $userRepository,
        CompanyRepository $companyRepository,
        RoleService $roleService
    ) {
        $this->userRepository = $userRepository;
        $this->companyRepository = $companyRepository;
        $this->roleService = $roleService;
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

        $this->userRepository->delete($userId);
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

        if (isset($data['role_slug'])) {
            $this->roleService->assignRole(
                $user->id,
                $data['role_slug'],
                $companyId,
                $data['resource_type'] ?? null,
                $data['resource_id'] ?? null
            );
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_id' => $user->company_id,
        ];
    }
}

