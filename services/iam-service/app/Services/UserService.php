<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Repositories\CompanyRepository;
use Illuminate\Support\Facades\Hash;

class UserService
{
    private UserRepository $userRepository;
    private CompanyRepository $companyRepository;

    public function __construct(
        UserRepository $userRepository,
        CompanyRepository $companyRepository
    ) {
        $this->userRepository = $userRepository;
        $this->companyRepository = $companyRepository;
    }

    public function listUsers(int $companyId, array $filters = []): array
    {
        $conditions = array_merge(['company_id' => $companyId], $filters);
        $users = $this->userRepository->findAll($conditions);

        return $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_id' => $user->company_id,
            ];
        })->toArray();
    }

    public function getUserById(int $userId, int $companyId): ?array
    {
        $user = $this->userRepository->findOne([
            'id' => $userId,
            'company_id' => $companyId,
        ]);

        if (!$user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_id' => $user->company_id,
        ];
    }

    public function updateUser(int $userId, int $companyId, array $data): ?array
    {
        $user = $this->userRepository->findOne([
            'id' => $userId,
            'company_id' => $companyId,
        ]);

        if (!$user) {
            return null;
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

    public function deleteUser(int $userId, int $companyId): bool
    {
        $user = $this->userRepository->findOne([
            'id' => $userId,
            'company_id' => $companyId,
        ]);

        if (!$user) {
            return false;
        }

        return $this->userRepository->delete($userId);
    }
}

