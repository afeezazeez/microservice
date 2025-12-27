export interface ExchangeConfig {
  name: string;
  type: string;
  durable: boolean;
}

export interface QueueBinding {
  exchange: string;
  routingKey: string;
}

export interface QueueConfig {
  name: string;
  durable: boolean;
  bindings: QueueBinding[];
}

