<?php

return [
    'secret' => env('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
    'ttl' => env('JWT_TTL', 60), // minutes
];

