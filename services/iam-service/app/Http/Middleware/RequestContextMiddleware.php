<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestContextMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = $request->headers->get('X-Correlation-Id') ?? (string) Str::uuid();

        // Ensure the correlation ID is available downstream and in logs
        $request->headers->set('X-Correlation-Id', $correlationId);

        Log::withContext([
            'correlation_id' => $correlationId,
            'http_method' => $request->getMethod(),
            'path' => $request->path(),
        ]);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set('X-Correlation-Id', $correlationId);

        return $response;
    }
}


