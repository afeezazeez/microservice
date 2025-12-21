<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class AssignRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role_slug' => ['required', 'string', 'exists:roles,slug'],
            'resource_type' => ['nullable', 'string', 'max:255'],
            'resource_id' => ['nullable', 'integer'],
        ];
    }
}

