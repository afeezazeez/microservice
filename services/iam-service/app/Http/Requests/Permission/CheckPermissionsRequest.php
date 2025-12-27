<?php

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;

class CheckPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer'],
            'permission_slugs' => ['required', 'array', 'min:1'],
            'permission_slugs.*' => ['string'],
            'resource_type' => ['nullable', 'string', 'max:255'],
            'resource_id' => ['nullable', 'integer'],
        ];
    }
}




