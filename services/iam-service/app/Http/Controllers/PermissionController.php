<?php

namespace App\Http\Controllers;

use App\Http\Requests\Permission\CheckPermissionRequest;
use App\Http\Requests\Permission\CheckPermissionsRequest;
use App\Services\PermissionService;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    private PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    public function check(CheckPermissionRequest $request)
    {
        $userId = $request->validated()['user_id'] ?? $request->input('user_id');

        if (!$userId) {
            $userId = $request->input('user_data.id');
        }

        $companyId = $request->validated()['company_id'] ?? $request->input('user_data.company_id');

        if (!$companyId) {
            return errorResponse('Company ID is required', [], 400);
        }

        $allowed = $this->permissionService->checkPermission(
            (int) $userId,
            $request->validated()['permission_slug'],
            (int) $companyId,
            $request->validated()['resource_type'] ?? null,
            $request->validated()['resource_id'] ?? null,
        );

        return successResponse('Permission check', ['allowed' => $allowed]);
    }

    public function checkBatch(CheckPermissionsRequest $request)
    {
        $userId = $request->validated()['user_id'] ?? $request->input('user_id');

        if (!$userId) {
            $userId = $request->input('user_data.id');
        }

        $companyId = $request->validated()['company_id'] ?? $request->input('user_data.company_id');

        if (!$companyId) {
            return errorResponse('Company ID is required', [], 400);
        }

        $results = $this->permissionService->checkPermissions(
            (int) $userId,
            $request->validated()['permission_slugs'],
            (int) $companyId,
            $request->validated()['resource_type'] ?? null,
            $request->validated()['resource_id'] ?? null,
        );

        return successResponse('Permission checks', $results);
    }
}


