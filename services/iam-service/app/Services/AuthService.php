<?php

namespace App\Services;

use App\Exceptions\ClientErrorException;
use App\Repositories\CompanyRepository;
use App\Repositories\UserRepository;
use App\Services\JWTService;
use App\Services\RoleService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
            'phone' => $companyData['phone'] ?? null,
            'address' => $companyData['address'] ?? null,
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
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_id' => $user->company_id,
            ],
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'identifier' => $company->identifier,
                'email' => $company->email,
            ],
            'token' => $token,
        ];
    }

    public function login(string $email, string $password): array
    {
        $user = $this->userRepository->findBy('email', $email);

        if (!$user) {
            Log::warning('auth_login_failed_user_not_found', [
                'email' => $email,
            ]);
            throw new ClientErrorException('Invalid credentials');
        }

        if (!Hash::check($password, $user->password)) {
            Log::warning('auth_login_failed_invalid_password', [
                'email' => $email,
                'user_id' => $user->id,
            ]);
            throw new ClientErrorException('Invalid credentials');
        }

        // Load company relation
        $user->load('company');

        // Get user's company-level roles
        $roles = $user->roles()
            ->where('user_roles.company_id', $user->company_id)
            ->whereNull('user_roles.resource_type')
            ->pluck('slug')
            ->toArray();

        $token = $this->jwtService->generateToken($user);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_id' => $user->company_id,
                'company_name' => $user->company?->name,
                'roles' => $roles,
            ],
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

    public function refreshToken(string $token): string
    {
        $refreshedToken = $this->jwtService->refreshToken($token);

        if (!$refreshedToken) {
            throw new ClientErrorException('Invalid or expired token');
        }

        return $refreshedToken;
    }

    public function logout(?string $token): void
    {
        if (!$token) {
            throw new ClientErrorException('Token not provided');
        }

        $this->jwtService->blacklistToken($token);
    }

    public function getAuthenticatedUser(int $userId): array
    {
        $user = $this->userRepository->findById($userId);

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

        $company = $this->companyRepository->findById($user->company_id);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_id' => $user->company_id,
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'identifier' => $company->identifier,
                'email' => $company->email,
            ] : null,
        ];
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

