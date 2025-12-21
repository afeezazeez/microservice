<?php

namespace App\Repositories;

use App\Models\UserRole;

class UserRoleRepository extends BaseRepository
{
    public function __construct(UserRole $model)
    {
        parent::__construct($model);
    }
}

