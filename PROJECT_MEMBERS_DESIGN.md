# Project Members & Roles - FAANG-Level Design

## Overview
This document defines the architecture for managing project members and their roles in a microservices environment following FAANG-level best practices.

## Core Principles

### 1. **Separation of Concerns**
- **IAM Service**: Single source of truth for ALL roles and permissions
- **Project Service**: Manages project membership (relationship only)
- **API Gateway**: Handles authentication; Project Service handles authorization

### 2. **Resource-Based Access Control (RBAC)**
- Roles can be **global** (company-wide) or **resource-specific** (project-specific)
- Example: User can be "project-manager" for Project A, "team-member" for Project B

---

## Architecture

### Tables

#### `project_members` (Project Service)
**Purpose**: Relationship table - tracks who is a member of which project

```sql
- id (PK)
- project_id (FK -> projects.id)
- user_id (INT, references IAM users table)
- joined_at (timestamp)
- created_at, updated_at
- UNIQUE(project_id, user_id)
```

**Key Points:**
- ✅ Stores ONLY the membership relationship
- ❌ Does NOT store roles (roles are in IAM)
- Used to: List members, check if user is member, track join date

#### `user_roles` (IAM Service)
**Purpose**: Single source of truth for ALL role assignments

```sql
- id (PK)
- user_id (FK -> users.id)
- role_id (FK -> roles.id)
- resource_type (nullable string, e.g., 'project', 'task', null for global)
- resource_id (nullable int, e.g., project_id=123, null for global)
- company_id (FK -> companies.id)
- created_at, updated_at
- INDEX(resource_type, resource_id)
- INDEX(user_id, company_id)
```

**Examples:**
```sql
-- Global role (company-wide)
user_id=1, role_id=2 (super-admin), resource_type=null, resource_id=null

-- Project-specific role
user_id=1, role_id=3 (project-manager), resource_type='project', resource_id=123
user_id=2, role_id=4 (team-member), resource_type='project', resource_id=123
user_id=3, role_id=5 (viewer), resource_type='project', resource_id=456
```

#### `roles` (IAM Service)
**Purpose**: Defines available roles in the system

```sql
- id (PK)
- name (e.g., "Project Manager")
- slug (e.g., "project-manager")
- description
```

**Available Roles:**
- `super-admin`: Full company access
- `project-manager`: Project and task management
- `team-member`: Standard access
- `viewer`: Read-only access

#### `permissions` (IAM Service)
**Purpose**: Defines granular permissions

```sql
- id (PK)
- name (e.g., "Create Project")
- slug (e.g., "project:create")
- resource_type (e.g., 'project')
- description
```

**Project Permissions:**
- `project:create`
- `project:edit`
- `project:delete`
- `project:view`

#### `role_permissions` (IAM Service)
**Purpose**: Maps roles to permissions

```sql
- role_id (FK)
- permission_id (FK)
```

**Example Mappings:**
- `project-manager` → `project:create`, `project:edit`, `project:delete`, `project:view`
- `team-member` → `project:view`
- `viewer` → `project:view`

---

## Data Flow

### Adding a Member to a Project

```
1. Frontend → API Gateway: POST /api/projects/{id}/members
   Body: { user_id: 123, role_slug: "project-manager" }

2. API Gateway → Project Service: POST /api/projects/{id}/members
   Headers: Authorization: Bearer <token>, x-correlation-id
   Body: { user_id: 123 }

3. Project Service:
   a. Validates JWT (extracts user_id, company_id)
   b. Validates project belongs to company
   c. Creates record in project_members table
      INSERT INTO project_members (project_id, user_id, joined_at)
      VALUES (project_id, 123, NOW())

4. Project Service → IAM Service (gRPC/HTTP):
   POST /api/roles/assign
   Body: {
     user_id: 123,
     role_slug: "project-manager",
     resource_type: "project",
     resource_id: project_id,
     company_id: company_id
   }

5. IAM Service:
   - Validates role exists
   - Creates record in user_roles table
   - Returns success

6. Response flows back to Frontend
```

### Checking Permissions

```
1. Frontend → API Gateway: PATCH /api/projects/123
   Headers: Authorization: Bearer <token>

2. API Gateway:
   - Validates JWT (extracts user_id, company_id)
   - Forwards request to Project Service

3. Project Service → IAM Service (gRPC/HTTP):
   POST /api/permissions/check
   Body: {
     user_id: user_id,
     permission_slug: "project:edit",
     resource_type: "project",
     resource_id: 123,
     company_id: company_id
   }

4. IAM Service:
   - Finds user_roles where:
     * user_id = user_id
     * company_id = company_id
     * (resource_type = 'project' AND resource_id = 123) OR (resource_type IS NULL)
   - For each role, checks if permission exists in role_permissions
   - Returns true/false

5. Project Service:
   - If permission granted → Process request
   - If denied → Return 403 Forbidden

6. Response flows back to Frontend
```

### Listing Project Members

```
1. Frontend → Project Service: GET /api/projects/{id}/members

2. Project Service:
   - Queries project_members table
   - Returns list of user_ids

3. Project Service → IAM Service (gRPC/HTTP):
   GET /api/users/{user_id}/roles?resource_type=project&resource_id={project_id}

4. IAM Service:
   - Returns roles for each user for this project
   - Format: [{ user_id, role: { slug, name }, resource_type, resource_id }]

5. Project Service:
   - Combines membership data (from project_members) with role data (from IAM)
   - Returns enriched member list:
     [
       {
         user_id: 123,
         joined_at: "2024-01-01",
         role: { slug: "project-manager", name: "Project Manager" }
       }
     ]
```

---

## API Design

### Project Service Endpoints

#### Add Member
```
POST /api/projects/{project_id}/members
Body: { user_id: number }

Note: Role assignment happens separately via IAM API
```

#### Remove Member
```
DELETE /api/projects/{project_id}/members/{user_id}

This should:
1. Remove from project_members table
2. Call IAM to remove project-specific roles
   DELETE /api/roles/remove
   Body: { user_id, role_slug, resource_type: "project", resource_id }
```

#### List Members
```
GET /api/projects/{project_id}/members

Returns:
{
  success: true,
  data: [
    {
      user_id: 123,
      user: { id, name, email },
      role: { slug: "project-manager", name: "Project Manager" },
      joined_at: "2024-01-01T00:00:00Z"
    }
  ],
  extra: []
}
```

### IAM Service Endpoints (for Project Service)

#### Assign Role to Resource
```
POST /api/roles/assign
Body: {
  user_id: number,
  role_slug: string,
  resource_type: "project",
  resource_id: number,
  company_id: number
}
```

#### Remove Role from Resource
```
DELETE /api/roles/remove
Body: {
  user_id: number,
  role_slug: string,
  resource_type: "project",
  resource_id: number
}
```

#### Check Permission
```
POST /api/permissions/check
Body: {
  user_id: number,
  permission_slug: "project:edit",
  resource_type: "project",
  resource_id: number,
  company_id: number
}

Returns: { has_permission: boolean }
```

#### Get User Roles for Resource
```
GET /api/users/{user_id}/roles?resource_type=project&resource_id={id}

Returns:
{
  success: true,
  data: [
    {
      role: { slug: "project-manager", name: "Project Manager" },
      resource_type: "project",
      resource_id: 123
    }
  ],
  extra: []
}
```

---

## Permission Checking Strategy

### Option 1: Check at API Gateway (Current)
- ❌ Not recommended - API Gateway shouldn't know business logic

### Option 2: Check at Project Service (Recommended - FAANG Standard)
- ✅ Project Service calls IAM Service to check permissions
- ✅ Project Service knows the business context (which project, what action)
- ✅ IAM Service is single source of truth for permissions
- ✅ Supports resource-specific permissions

**Implementation:**
```typescript
// Project Service
async function checkPermission(
  userId: number,
  permissionSlug: string,
  resourceType: string,
  resourceId: number,
  companyId: number
): Promise<boolean> {
  const response = await iamClient.post('/api/permissions/check', {
    user_id: userId,
    permission_slug: permissionSlug,
    resource_type: resourceType,
    resource_id: resourceId,
    company_id: companyId
  });
  return response.data.has_permission;
}
```

---

## Key Design Decisions

### 1. Why Two Tables?

**`project_members` (Project Service)**
- Fast queries: "Is user X a member of project Y?"
- Track membership metadata: `joined_at`
- Service owns its data (database-per-service pattern)

**`user_roles` (IAM Service)**
- Centralized role management
- Supports global + resource-specific roles
- Single source of truth for all role assignments
- Enables cross-service permission checking

### 2. Why Not Store Role in `project_members`?
- ❌ Duplicates data (violates DRY)
- ❌ Creates inconsistency risk
- ❌ Doesn't support multiple roles per resource
- ❌ Can't leverage IAM's permission system

### 3. Role Assignment Flow
1. Add member to project → `project_members` table
2. Assign role → `user_roles` table (IAM Service)
3. These are separate operations for flexibility

### 4. Permission Resolution
IAM Service checks permissions in this order:
1. Resource-specific roles (resource_type='project', resource_id=123)
2. Global roles (resource_type=null, resource_id=null)
3. Returns true if ANY role has the required permission

---

## Example Scenarios

### Scenario 1: User is Project Manager for Project A, Team Member for Project B

**`project_members` table:**
```
id | project_id | user_id | joined_at
1  | 123        | 100     | 2024-01-01
2  | 456        | 100     | 2024-01-02
```

**`user_roles` table (IAM):**
```
id | user_id | role_id | resource_type | resource_id | company_id
1  | 100     | 3       | 'project'     | 123         | 1
2  | 100     | 4       | 'project'     | 456         | 1
```

User 100 can:
- Edit Project 123 (project-manager role)
- View Project 456 (team-member role)
- Cannot edit Project 456 (team-member doesn't have edit permission)

### Scenario 2: User is Global Admin + Project Member

**`user_roles` table (IAM):**
```
id | user_id | role_id | resource_type | resource_id | company_id
1  | 200     | 1       | null          | null        | 1  (super-admin)
2  | 200     | 4       | 'project'     | 123         | 1  (team-member)
```

User 200:
- Has global admin access (can do anything in company)
- Also has explicit team-member role for project 123 (redundant but explicit)

---

## Summary

✅ **Current Design is Correct:**
- `project_members` = membership relationship only
- `user_roles` = role assignments (IAM Service)
- Separation of concerns maintained
- Supports resource-based access control

✅ **What's Needed:**
- Project Service calls IAM Service for permission checks
- Project Service calls IAM Service when adding/removing members (to assign/remove roles)
- Both tables work together but serve different purposes

✅ **FAANG-Level Principles:**
- Single source of truth (IAM for roles)
- Service autonomy (Project Service owns membership)
- Resource-based RBAC
- Clear separation of concerns
- Scalable and flexible architecture

