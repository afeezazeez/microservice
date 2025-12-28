<?php

return [
    'host' => env('RABBITMQ_HOST', 'rabbitmq'),
    'port' => env('RABBITMQ_PORT', 5672),
    'user' => env('RABBITMQ_USER', 'admin'),
    'password' => env('RABBITMQ_PASSWORD', 'admin123'),
    'vhost' => env('RABBITMQ_VHOST', '/'),
    'exchanges' => [
        'user_events' => 'user.events',
    ],
];

