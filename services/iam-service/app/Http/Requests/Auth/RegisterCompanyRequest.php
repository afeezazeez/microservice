<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company' => ['required', 'array'],
            'company.name' => ['required', 'string', 'max:255'],
            'company.email' => ['required', 'email', 'max:255', 'unique:companies,email'],
            'company.phone' => ['nullable', 'string', 'max:20'],
            'company.address' => ['nullable', 'string', 'max:500'],
            'user' => ['required', 'array'],
            'user.name' => ['required', 'string', 'max:255'],
            'user.email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'user.password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'company.email.unique' => 'Company email already exists',
            'user.email.unique' => 'User email already exists',
            'user.password.min' => 'Password must be at least 8 characters',
            'user.password.confirmed' => 'Password confirmation does not match',
        ];
    }
}

