<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Administrator of a company with full company access',
            ],
            [
                'name' => 'Project Manager',
                'slug' => 'project-manager',
                'description' => 'Manages projects and tasks within assigned projects',
            ],
            [
                'name' => 'Team Member',
                'slug' => 'team-member',
                'description' => 'Regular team member with standard access',
            ],
            [
                'name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Read-only access to projects and tasks',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }
    }
}
