<?php

namespace App\Services;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use Illuminate\Support\Facades\Log;

class RabbitMQService
{
    private ?AMQPStreamConnection $connection = null;
    private $channel = null;

    private function connect(): void
    {
        if ($this->connection && $this->connection->isConnected()) {
            return;
        }

        try {
            $this->connection = new AMQPStreamConnection(
                config('rabbitmq.host'),
                config('rabbitmq.port'),
                config('rabbitmq.user'),
                config('rabbitmq.password'),
                config('rabbitmq.vhost', '/')
            );

            $this->channel = $this->connection->channel();
        } catch (\Exception $e) {
            Log::error('Failed to connect to RabbitMQ: ' . $e->getMessage());
            throw $e;
        }
    }

    public function publish(string $exchange, string $routingKey, array $message): void
    {
        try {
            $this->connect();

            $this->channel->exchange_declare($exchange, 'topic', false, true, false);

            $msg = new AMQPMessage(
                json_encode($message),
                ['delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT]
            );

            $this->channel->basic_publish($msg, $exchange, $routingKey);
        } catch (\Exception $e) {
            Log::error('Failed to publish message to RabbitMQ: ' . $e->getMessage(), [
                'exchange' => $exchange,
                'routing_key' => $routingKey,
            ]);
        }
    }

    public function __destruct()
    {
        if ($this->channel) {
            $this->channel->close();
        }
        if ($this->connection && $this->connection->isConnected()) {
            $this->connection->close();
        }
    }
}

