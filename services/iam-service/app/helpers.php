<?php

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\MessageBag;

if (!function_exists('successResponse')) {
    function successResponse(string $message = '', array $data = [], int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'extra' => []
        ], $code);
    }
}

if (!function_exists('errorResponse')) {
    function errorResponse(string $error = null, array $data = [], MessageBag $errors = null, array $trace = [], int $code = Response::HTTP_BAD_REQUEST): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => $data,
            'error' => $error,
            'errors' => $errors ?? [],
            'trace' => $trace
        ], $code);
    }
}

