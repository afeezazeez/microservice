<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\UpdateUserRequest;
use App\Services\UserService;
use App\Exceptions\ClientErrorException;
use Illuminate\Http\Request;

class UserController extends Controller
{
    private UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index(Request $request)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $users = $this->userService->listUsers($companyId);

        return successResponse('Users retrieved successfully', $users);
    }

    public function show(Request $request, int $id)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $user = $this->userService->getUserById($id, $companyId);

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

        return successResponse('User retrieved successfully', $user);
    }

    public function update(UpdateUserRequest $request, int $id)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $user = $this->userService->updateUser($id, $companyId, $request->validated());

        if (!$user) {
            throw new ClientErrorException('User not found');
        }

        return successResponse('User updated successfully', $user);
    }

    public function destroy(Request $request, int $id)
    {
        $companyId = $request->input('user_data')['company_id'] ?? null;

        if (!$companyId) {
            throw new ClientErrorException('Company ID not found');
        }

        $deleted = $this->userService->deleteUser($id, $companyId);

        if (!$deleted) {
            throw new ClientErrorException('User not found');
        }

        return successResponse('User deleted successfully');
    }
}

