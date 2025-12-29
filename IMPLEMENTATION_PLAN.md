# Task & File Services Implementation Plan

**Temporary document - Delete when implementation is complete**

This document outlines the step-by-step implementation order for Task Service and File Service.

---

## Phase 1: Task Service - Core APIs (No File Handling)

**Goal**: Get basic task management working without file attachments

### Tasks:
1. ✅ Setup Task Service structure (similar to project-service)
   - Copy project-service structure as template
   - Update package.json, Dockerfile, etc.
   - Setup TypeScript, Express, Sequelize

2. ✅ Database schema & migrations
   - Create `tasks` table: id, project_id, title, description, status, assigned_to, created_by, due_date, created_at, updated_at
   - Create `task_watchers` table: id, task_id, user_id, created_at, updated_at
   - Create status enum: TODO, IN_PROGRESS, DONE, BLOCKED

3. ✅ Models & Repositories
   - Task model (Sequelize)
   - TaskWatcher model (Sequelize)
   - TaskRepository (CRUD operations)
   - TaskWatcherRepository (watch/unwatch operations)

4. ✅ Services & Controllers
   - TaskService (business logic)
   - TaskController (HTTP handlers)
   - Watch/unwatch logic (auto-watch creator on task creation)

5. ✅ Routes & Middleware
   - Setup routes with auth middleware
   - Permission middleware (task:create, task:update, task:delete)
   - Watch/unwatch endpoints: POST /tasks/:id/watch, DELETE /tasks/:id/watch

6. ✅ Docker & Docker Compose
   - Uncomment task-service in docker-compose.yml
   - Setup entrypoint script (migrations)
   - Test service startup

7. ✅ API Gateway Integration
   - Add task-service routes to API Gateway
   - Proxy /api/tasks/* → task-service:3002

8. ✅ Makefile Updates
   - Add task-service to SERVICES list
   - Add to status output

**Deliverable**: Task CRUD APIs working, watch/unwatch working, no file handling yet

---

## Phase 2: File Service Setup & Integration

**Goal**: Add file upload/download capability and integrate with Task Service

### Tasks:
1. ✅ Setup File Service structure
   - Copy project-service structure as template
   - Update package.json, Dockerfile, etc.

2. ✅ Database schema & migrations
   - Create `files` table: id, task_id, filename, original_name, mime_type, size, storage_path, uploaded_by, created_at, updated_at

3. ✅ MinIO Integration
   - Setup MinIO client
   - Create bucket if not exists
   - Upload/download/delete file operations

4. ✅ Models & Repositories
   - File model (Sequelize)
   - FileRepository (CRUD operations)

5. ✅ Services & Controllers
   - FileService (MinIO operations)
   - FileController (upload, download, delete, list by task_id)

6. ✅ Routes & Middleware
   - Setup routes with auth middleware
   - Permission middleware (file:upload, file:download, file:delete)

7. ✅ Docker & Docker Compose
   - Uncomment file-service in docker-compose.yml
   - Setup entrypoint script (migrations)
   - Test service startup

8. ✅ Task Service ↔ File Service Integration
   - Task Service calls File Service API (HTTP) to upload files
   - Task Service stores file_id references (or file_ids array)
   - Update task creation/update to handle file uploads

9. ✅ API Gateway Integration
   - Add file-service routes to API Gateway
   - Proxy /api/files/* → file-service:3004

10. ✅ Makefile Updates
    - Add file-service to SERVICES list
    - Add to status output

**Deliverable**: File upload/download working, tasks can have file attachments

---

## Phase 3: RabbitMQ Events & Notifications

**Goal**: Add event-driven notifications for task events

### Tasks:
1. ✅ Task Service - RabbitMQ Setup
   - Setup RabbitMQService (similar to project-service)
   - Configure exchanges and routing keys

2. ✅ Task Service - Publish Events
   - Publish `task.created` event (include: task_id, project_id, title, assigned_to, created_by, watcher_ids)
   - Publish `task.updated` event (include: task_id, assigned_to, watcher_ids)
   - Publish `task.status_changed` event (include: task_id, old_status, new_status, assigned_to, watcher_ids)
   - Publish `task.deleted` event (include: task_id, assigned_to, watcher_ids)

3. ✅ Notification Service - Event Types
   - Add task event interfaces: TaskCreatedEvent, TaskUpdatedEvent, TaskStatusChangedEvent, TaskDeletedEvent

4. ✅ Notification Service - RabbitMQ Configuration
   - Add task.events exchange
   - Add queues: task.created, task.updated, task.status_changed, task.deleted

5. ✅ Notification Service - Event Handlers
   - TaskCreatedHandler: Send email to assignee (if exists) + all watchers
   - TaskUpdatedHandler: Send email to assignee (if exists) + all watchers
   - TaskStatusChangedHandler: Send email to assignee (if exists) + all watchers
   - TaskDeletedHandler: Send email to assignee (if exists) + all watchers

6. ✅ Notification Service - Email Templates
   - Create email templates for task events
   - Include task details, project name, status changes, etc.

7. ✅ Testing
   - Test all event flows
   - Verify emails are sent correctly
   - Test watcher notifications

**Deliverable**: Task events trigger email notifications to assignees and watchers

---

## Implementation Order Summary

1. **Phase 1**: Task Service APIs (no files) ✅
2. **Phase 2**: File Service + Integration ✅
3. **Phase 3**: RabbitMQ Events + Notifications ✅

**Delete this file when all phases are complete!**


