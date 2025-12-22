<?php

use App\Exceptions\ClientErrorException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\RequestContextMiddleware::class);

        $middleware->alias([
            'jwt.auth' => \App\Http\Middleware\JWTAuthMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Don't log client errors (4xx) - they're expected client mistakes, not server problems
        $exceptions->dontReport([
            ClientErrorException::class,
            ValidationException::class,
            AuthenticationException::class,
            ThrottleRequestsException::class,
        ]);

        $exceptions->render(function (Throwable $e) {
            $error = null;
            $errors = null;
            $code = Response::HTTP_INTERNAL_SERVER_ERROR;

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                $error = 'Route not found';
                if ($e instanceof ModelNotFoundException) {
                    $modelName = class_basename($e->getModel());
                    $error = "$modelName not found";
                }
                $code = Response::HTTP_NOT_FOUND;
            } elseif ($e instanceof ValidationException) {
                $error = 'Failed validation';
                $errors = $e->validator->errors();
                $code = Response::HTTP_UNPROCESSABLE_ENTITY;
            } elseif ($e instanceof AuthenticationException) {
                $error = 'Unauthorized';
                $code = Response::HTTP_UNAUTHORIZED;
            } elseif ($e instanceof ClientErrorException) {
                $error = $e->getMessage();
                $code = Response::HTTP_BAD_REQUEST;
            } elseif ($e instanceof ThrottleRequestsException) {
                $error = 'Max attempts exceeded. Retry later.';
                $code = Response::HTTP_TOO_MANY_REQUESTS;
            } else {
                $error = $e->getMessage();
                // Only log unexpected server errors (5xx)
                Log::error('exception_handled', [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'code' => $code,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
            }

            return errorResponse($error, [], $errors, [], $code);
        });
    })->create();
