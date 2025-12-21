<?php

namespace App\Services;

use App\Repositories\CompanyRepository;
use App\Repositories\UserRepository;
use App\Services\JWTService;
use App\Services\RoleService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    private UserRepository $userRepository;
    private CompanyRepository $companyRepository;
    private RoleService $roleService;
    private JWTService $jwtService;

    public function __construct(
        UserRepository $userRepository,
        CompanyRepository $companyRepository,
        RoleService $roleService,
        JWTService $jwtService
    ) {
        $this->userRepository = $userRepository;
        $this->companyRepository = $companyRepository;
        $this->roleService = $roleService;
        $this->jwtService = $jwtService;
    }

    public function registerCompany(array $companyData, array $userData): array
    {
        $identifier = $this->generateUniqueIdentifier();

        $company = $this->companyRepository->create([
            'name' => $companyData['name'],
            'identifier' => $identifier,
            'email' => $companyData['email'],
            'phone' => $companyData['phone'] ,
            'address' => $companyData['address'] ,
        ]);

        $user = $this->userRepository->create([
            'company_id' => $company->id,
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => Hash::make($userData['password']),
        ]);

        $this->roleService->assignRole($user->id, 'super-admin', $company->id);

        $token = $this->jwtService->generateToken($user);

        return [
            'user' => $user,
            'company' => $company,
            'token' => $token,
        ];
    }

    public function login(string $email, string $password): ?array
    {
        $user = $this->userRepository->findBy('email', $email);

        if (!$user || !Hash::check($password, $user->password)) {
            return null;
        }

        $token = $this->jwtService->generateToken($user);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function registerUser(array $userData, int $companyId): array
    {
        $user = $this->userRepository->create([
            'company_id' => $companyId,
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => Hash::make($userData['password']),
        ]);

        if (isset($userData['role_slug'])) {
            $this->roleService->assignRole(
                $user->id,
                $userData['role_slug'],
                $companyId,
                $userData['resource_type'] ?? null,
                $userData['resource_id'] ?? null
            );
        }

        $token = $this->jwtService->generateToken($user);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function refreshToken(string $token): ?string
    {
        return $this->jwtService->refreshToken($token);
    }

    private function generateUniqueIdentifier(): string
    {
        do {
            $identifier = Str::random(12);
            $exists = $this->companyRepository->findBy('identifier', $identifier);
        } while ($exists);

        return $identifier;
    }
}

