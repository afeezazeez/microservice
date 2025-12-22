# Communication Patterns

This document explains how services communicate in our microservices architecture.

## Overview

We use **three communication patterns**:

1. **HTTP (Synchronous)** - Direct service calls
2. **RabbitMQ (Asynchronous)** - Event-driven messaging
3. **RPC (Synchronous HTTP)** - Service-to-service calls (NOT RabbitMQ)

---

## 1. HTTP (Synchronous)

### When to use:
- Frontend → API Gateway → Services
- Service-to-service calls that need immediate response
- CRUD operations

### Example:
```typescript
// API Gateway → Project Service
const response = await axios.get('http://project-service:3001/projects/123');
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

#### Direct Exchange
- Routes to specific queue based on routing key
- **Use case**: Task assignment → Specific user notification

```typescript
// Task Service publishes
rabbitmq.publish('notifications.direct', 'user.123', {
  userId: 123,
  message: 'Task assigned to you'
});

// Notification Service consumes
rabbitmq.consume('notifications.direct', 'user.123', (message) => {
  // Send notification to user 123
});
```

#### Topic Exchange
- Routes based on pattern matching
- **Use case**: Project updates → Notify all project members

```typescript
// Task Service publishes
rabbitmq.publish('notifications.topic', 'project.123.task.created', {
  projectId: 123,
  taskId: 456
});

// Notification Service consumes with pattern
rabbitmq.consume('notifications.topic', 'project.*.task.*', (message) => {
  // Notify all project members
});
```

#### Fanout Exchange
- Broadcasts to all queues
- **Use case**: System-wide announcements

```typescript
// Admin Service publishes
rabbitmq.publish('announcements.fanout', '', {
  message: 'System maintenance scheduled'
});

// All services consume
rabbitmq.consume('announcements.fanout', '', (message) => {
  // Handle announcement
});
```

---

## 3. RPC (Synchronous HTTP)

### ⚠️ IMPORTANT: RPC = HTTP Calls, NOT RabbitMQ

### When to use:
- Permission checks
- Token validation
- Data validation
- Any operation that needs immediate response

### Example:
```typescript
// API Gateway → IAM Service (HTTP RPC)
const hasPermission = await axios.post('http://iam-service:8000/api/rpc/check-permission', {
  userId: 123,
  permission: 'task:create',
  resourceId: 456
});

// Response: { hasAccess: true/false }
```

### Flow:
```
API Gateway → HTTP Request → IAM Service
           ← HTTP Response ←
```

### Why NOT RabbitMQ for RPC?
- RabbitMQ is for **asynchronous** operations
- RPC needs **immediate response**
- HTTP is simpler and more direct for synchronous calls
- Lower latency for permission checks

---

## Communication Examples

### Example 1: Creating a Task

```
1. Frontend → API Gateway (HTTP)
   POST /api/v1/projects/123/tasks

2. API Gateway → IAM Service (HTTP RPC)
   Check permission: 'task:create' on project 123
   Response: { hasAccess: true }

3. API Gateway → Task Service (HTTP)
   POST /tasks { projectId: 123, title: "New task" }

4. Task Service → RabbitMQ (Async)
   Publish: 'project.123.task.created'

5. Notification Service (consumes from RabbitMQ)
   Notify all project members

6. Task Service → API Gateway → Frontend (HTTP Response)
   { taskId: 456, ... }
```

### Example 2: File Upload

```
1. Frontend → API Gateway (HTTP)
   POST /api/v1/files/upload

2. API Gateway → IAM Service (HTTP RPC)
   Check permission: 'task:create' on project 123
   Response: { hasAccess: true }

3. API Gateway → File Service (HTTP)
   POST /files/upload (multipart/form-data)

4. File Service → MinIO (S3 API)
   Upload file to bucket

5. File Service → RabbitMQ (Async - Topic Exchange)
   Publish: 'file.uploaded' → Analytics Service

6. File Service → API Gateway → Frontend (HTTP Response)
   { fileId: 789, url: '...' }
```

---

## Summary

| Pattern | Type | Use Case | Example |
|---------|------|----------|---------|
| **HTTP** | Synchronous | Direct calls, CRUD | Frontend → API Gateway → Service |
| **RabbitMQ** | Asynchronous | Events, notifications | Task created → Notify users |
| **RPC (HTTP)** | Synchronous | Permission checks, validation | API Gateway → IAM Service |

