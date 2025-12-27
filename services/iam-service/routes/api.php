<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'registerCompany']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refreshToken']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('jwt.auth');
    Route::get('/me', [AuthController::class, 'me'])->middleware('jwt.auth');
});

Route::prefix('users')->middleware('jwt.auth')->group(function () {
    Route::post('/', [UserController::class, 'store']);
    Route::get('/', [UserController::class, 'index']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
});

Route::prefix('roles')->middleware('jwt.auth')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::get('/user/{userId}', [RoleController::class, 'getUserRoles']);
    Route::post('/assign', [RoleController::class, 'assignRole']);
    Route::post('/remove', [RoleController::class, 'removeRole']);
});

