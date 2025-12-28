# Communication Patterns

This document explains how services communicate in our microservices architecture.

## Overview

We use **three communication patterns**:

1. **HTTP (Synchronous)** - Direct service calls
2. **RabbitMQ (Asynchronous)** - Event-driven messaging

### Note on gRPC

**gRPC** could be used for high-volume, low-latency service-to-service calls, but **we do not use it in this project**. We use HTTP/REST for all synchronous service-to-service communication.

---

## 1. HTTP (Synchronous)

### When to use:
- Frontend → API Gateway → Services
- Service-to-service calls that need immediate response
- CRUD operations

### Example:
```typescript
// API Gateway → Project Service (via reverse proxy)
const response = await axios.get('https://project-service.afeez-dev.local/api/projects/123');
```

### Flow:
```
Frontend → API Gateway → Service
         ← Response ←
```

---

## 2. RabbitMQ (Asynchronous)

### When to use:
- Event-driven operations
- Decoupled services
- Background processing
- Notifications

### Exchange Types:

#### Topic Exchange (Currently Used)
- Routes based on routing key matching
- **Use case**: User events, Project events

**Publishing from IAM Service (Laravel/PHP):**
```php
// IAM Service publishes user.created event
$this->rabbitMQService->publish(
    config('rabbitmq.exchanges.user_events'),
    'user.created',
    [
        'event' => 'user.created',
        'data' => [
            'id' => $user->id,
            'company_id' => $user->company_id,
            'name' => $user->name,
            'email' => $user->email,
        ],
    ]
);
```

**Publishing from Project Service (Node.js/TypeScript):**
```typescript
// Project Service publishes project.member.added event
await this.rabbitMQService.publish('project.events', 'project.member.added', {
  event: 'project.member.added',
  data: {
    project_name: project.name,
    user_id: dto.user_id,
    company_name: companyName || '',
  },
});
```

**Consuming in Notification Service (Node.js/TypeScript):**
```typescript
// Notification Service automatically consumes events
// Events are routed to queues based on routing keys:
// - user.created → user.created queue
// - user.updated → user.updated queue
// - user.deleted → user.deleted queue
// - user.invited → user.invited queue
// - project.member.added → project.member.added queue
// - project.member.removed → project.member.removed queue

// Handlers are registered via EventHandlerFactory
const handler = EventHandlerFactory.getHandler(event.event);
await handler.handle(event);
```

---

## Event-Driven Architecture & User Synchronization

### User Synchronization (IAM ↔ Notification Service)

The Notification Service maintains a local copy of user data to enable efficient lookups and notifications without constantly querying the IAM service. This synchronization happens automatically through RabbitMQ events:

**How it works:**
1. **User Created**: When a user registers or is invited in the IAM service, a `user.created` event is published with user details (ID, company ID, name, email - password excluded)
2. **User Updated**: When user information changes in IAM, a `user.updated` event is published with the updated user snapshot
3. **User Deleted**: When a user is deleted, a `user.deleted` event is published with just the user ID
4. **Notification Service**: Consumes these events and maintains a local `users` table, keeping it in sync with the IAM service

**Benefits:**
- **Decoupled**: Notification service doesn't need direct database access to IAM
- **Efficient**: Fast user lookups for sending notifications without HTTP calls
- **Resilient**: Works even if IAM service is temporarily unavailable
- **Eventual Consistency**: User data stays synchronized through events

### RabbitMQ Events Overview

The system uses **Topic Exchanges** for event-driven communication. Here's an overview of the events being processed:

#### User Events (`user.events` exchange)
- **`user.created`** - Published when a user registers or is invited. Notification service creates a local user record.
- **`user.updated`** - Published when user details are modified. Notification service updates its local user record.
- **`user.deleted`** - Published when a user is removed. Notification service deletes the local user record.
- **`user.invited`** - Published when a user is invited to a company. Triggers welcome email with company and role information.

#### Project Events (`project.events` exchange)
- **`project.member.added`** - Published when a user is added to a project. Notification service looks up user details from its local database and sends a notification email.
- **`project.member.removed`** - Published when a user is removed from a project (or when a project is deleted). Notification service sends a removal notification email.

**Event Flow Example:**
```
IAM Service (User Created)
    ↓ publishes user.created event
RabbitMQ (Topic Exchange)
    ↓ routes to notification-service queue
Notification Service
    ↓ consumes event
    ↓ creates user in local database
    ↓ ready to send notifications
```

**Why this pattern?**
- **Loose Coupling**: Services don't need to know about each other's internal structure
- **Scalability**: Events can be consumed by multiple services if needed
- **Reliability**: Events are persisted in RabbitMQ, ensuring no data loss
- **Performance**: Asynchronous processing doesn't block the main request flow

---

## Communication Examples

### Example 1: User Invitation Flow

```
1. IAM Service (Laravel)
   UserService::inviteUser() creates user
   
2. IAM Service → RabbitMQ (Async)
   $this->rabbitMQService->publish(
       'user.events',
       'user.created',
       ['event' => 'user.created', 'data' => {...}]
   )
   
3. IAM Service → RabbitMQ (Async)
   $this->rabbitMQService->publish(
       'user.events',
       'user.invited',
       ['event' => 'user.invited', 'data' => {...}]
   )

4. Notification Service (consumes from RabbitMQ)
   - user.created event → Creates user in local database
   - user.invited event → Sends welcome email with company/role info
```

### Example 2: Adding Project Member

```
1. Project Service (Node.js)
   ProjectService::addMember() adds user to project
   
2. Project Service → RabbitMQ (Async)
   await this.rabbitMQService.publish('project.events', 'project.member.added', {
     event: 'project.member.added',
     data: { project_name, user_id, company_name }
   })

3. Notification Service (consumes from RabbitMQ)
   - Looks up user details from local database
   - Sends notification email to user
```

### Example 3: User Registration Flow

```
1. IAM Service (Laravel)
   AuthService::registerUser() creates new user
   
2. IAM Service → RabbitMQ (Async)
   $this->rabbitMQService->publish(
       'user.events',
       'user.created',
       ['event' => 'user.created', 'data' => {...}]
   )

3. Notification Service (consumes from RabbitMQ)
   - Creates user record in local users table
   - User data now available for future notifications
```

---

## Summary

| Pattern | Type | Use Case | Example |
|---------|------|----------|---------|
| **HTTP** | Synchronous | Direct calls, CRUD | Frontend → API Gateway → Service |
| **RabbitMQ** | Asynchronous | Events, notifications | Task created → Notify users 
