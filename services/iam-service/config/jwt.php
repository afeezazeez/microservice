<?php

return [
    'secret' => env('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
    'access_token_ttl' => env('JWT_ACCESS_TOKEN_TTL', 5), // minutes
    'refresh_token_ttl' => env('JWT_REFRESH_TOKEN_TTL', 1440), // minutes (24 hours)
];

