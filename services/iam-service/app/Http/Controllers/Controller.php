<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "IAM Service API",
    description: "Identity and Access Management Service API Documentation"
)]
#[OA\Server(
    url: "http://localhost:8001/api",
    description: "IAM Service API Server"
)]
#[OA\SecurityScheme(
    securityScheme: "bearerAuth",
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
)]
abstract class Controller
{
    //
}
