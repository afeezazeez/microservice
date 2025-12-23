<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserRole>
 */
class UserRoleFactory extends Factory
{
    protected $model = UserRole::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'role_id' => function (array $attributes) {
                // Use first available role from seeded data
                return \App\Models\Role::first()?->id ?? 1;
            },
            'company_id' => Company::factory(),
            'resource_type' => null,
            'resource_id' => null,
        ];
    }

    /**
     * Indicate that the role is resource-specific.
     */
    public function forResource(string $resourceType, int $resourceId): static
    {
        return $this->state(fn (array $attributes) => [
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
        ]);
    }
}

