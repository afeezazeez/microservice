<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Super Admin - All permissions
        $superAdmin = Role::where('slug', 'super-admin')->first();
        if ($superAdmin) {
            $superAdmin->permissions()->sync(Permission::pluck('id'));
        }

        // Project Manager - Project and task management
        $projectManager = Role::where('slug', 'project-manager')->first();
        if ($projectManager) {
            $projectManagerPermissions = Permission::whereIn('slug', [
                'project:create',
                'project:edit',
                'project:view',
                'task:create',
                'task:edit',
                'task:delete',
                'task:view',
                'task:assign',
                'file:upload',
                'file:view',
            ])->pluck('id');
            $projectManager->permissions()->sync($projectManagerPermissions);
        }

        // Team Member - Standard access
        $teamMember = Role::where('slug', 'team-member')->first();
        if ($teamMember) {
            $teamMemberPermissions = Permission::whereIn('slug', [
                'project:view',
                'task:create',
                'task:edit',
                'task:view',
                'file:upload',
                'file:view',
            ])->pluck('id');
            $teamMember->permissions()->sync($teamMemberPermissions);
        }

        // Viewer - Read-only access
        $viewer = Role::where('slug', 'viewer')->first();
        if ($viewer) {
            $viewerPermissions = Permission::whereIn('slug', [
                'project:view',
                'task:view',
                'file:view',
            ])->pluck('id');
            $viewer->permissions()->sync($viewerPermissions);
        }
    }
}
