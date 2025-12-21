<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'registerCompany']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refreshToken']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('jwt.auth');
    Route::get('/me', [AuthController::class, 'me'])->middleware('jwt.auth');
});

