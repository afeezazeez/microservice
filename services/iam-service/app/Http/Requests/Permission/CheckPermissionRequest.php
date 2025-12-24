<?php

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;

class CheckPermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer'],
            'permission_slug' => ['required', 'string'],
            'resource_type' => ['nullable', 'string', 'max:255'],
            'resource_id' => ['nullable', 'integer'],
        ];
    }
}



