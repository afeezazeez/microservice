<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

abstract class BaseRepository
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function findById(int $id, array $with = []): ?Model
    {
        return $this->model->with($with)->find($id);
    }

    public function findOne(array $conditions, array $with = []): ?Model
    {
        return $this->model->with($with)->where($conditions)->first();
    }

    public function findBy(string $field, $value, array $with = []): ?Model
    {
        return $this->model->with($with)->where($field, $value)->first();
    }

    public function findAll(array $conditions = [], array $with = []): Collection
    {
        return $this->model->with($with)->where($conditions)->get();
    }

    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $model = $this->findById($id);
        
        if (!$model) {
            return false;
        }

        return $model->update($data);
    }

    public function delete(int $id): bool
    {
        $model = $this->findById($id);
        
        if (!$model) {
            return false;
        }

        return $model->delete();
    }
}

