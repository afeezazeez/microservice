<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Task permissions
            [
                'name' => 'Create Task',
                'slug' => 'task:create',
                'resource_type' => 'task',
                'description' => 'Create new tasks',
            ],
            [
                'name' => 'Edit Task',
                'slug' => 'task:edit',
                'resource_type' => 'task',
                'description' => 'Edit existing tasks',
            ],
            [
                'name' => 'Delete Task',
                'slug' => 'task:delete',
                'resource_type' => 'task',
                'description' => 'Delete tasks',
            ],
            [
                'name' => 'View Task',
                'slug' => 'task:view',
                'resource_type' => 'task',
                'description' => 'View tasks',
            ],
            [
                'name' => 'Assign Task',
                'slug' => 'task:assign',
                'resource_type' => 'task',
                'description' => 'Assign tasks to users',
            ],

            // Project permissions
            [
                'name' => 'Create Project',
                'slug' => 'project:create',
                'resource_type' => 'project',
                'description' => 'Create new projects',
            ],
            [
                'name' => 'Edit Project',
                'slug' => 'project:edit',
                'resource_type' => 'project',
                'description' => 'Edit existing projects',
            ],
            [
                'name' => 'Delete Project',
                'slug' => 'project:delete',
                'resource_type' => 'project',
                'description' => 'Delete projects',
            ],
            [
                'name' => 'View Project',
                'slug' => 'project:view',
                'resource_type' => 'project',
                'description' => 'View projects',
            ],

            // File permissions
            [
                'name' => 'Upload File',
                'slug' => 'file:upload',
                'resource_type' => 'file',
                'description' => 'Upload files',
            ],
            [
                'name' => 'Delete File',
                'slug' => 'file:delete',
                'resource_type' => 'file',
                'description' => 'Delete files',
            ],
            [
                'name' => 'View File',
                'slug' => 'file:view',
                'resource_type' => 'file',
                'description' => 'View files',
            ],

            // User permissions
            [
                'name' => 'Invite User',
                'slug' => 'user:invite',
                'resource_type' => 'user',
                'description' => 'Invite users to company',
            ],
            [
                'name' => 'Update User',
                'slug' => 'user:update',
                'resource_type' => 'user',
                'description' => 'Update user information',
            ],
            [
                'name' => 'Delete User',
                'slug' => 'user:delete',
                'resource_type' => 'user',
                'description' => 'Permanently delete users from company (hard delete)',
            ],
            [
                'name' => 'Remove User',
                'slug' => 'user:remove',
                'resource_type' => 'user',
                'description' => 'Remove users from specific resource (e.g., project, team) but keep in company',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }
}
