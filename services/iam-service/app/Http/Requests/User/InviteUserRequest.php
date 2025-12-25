<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class InviteUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role_slug' => ['nullable', 'string', 'exists:roles,slug'],
            'resource_type' => ['nullable', 'string', 'max:255'],
            'resource_id' => ['nullable', 'integer'],
        ];
    }
}

