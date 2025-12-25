# Project Service Permission Checks

## Available Permissions (from IAM Service)

- `project:create` - Create new projects
- `project:edit` - Edit existing projects  
- `project:delete` - Delete projects
- `project:view` - View projects

---

## Permission Checks Required

### 1. **Create Project** - `POST /projects`

**Permission**: `project:create`

**Resource Context**: 
- `resource_type`: `null` (global/company-level permission)
- `resource_id`: `null`

**Reason**: Creating a new project doesn't have a resource_id yet. This checks if the user has permission to create projects in the company.

**Check Location**: Before creating the project in `ProjectService.createProject()`

---

### 2. **List Projects** - `GET /projects`

**Permission**: `project:view`

**Resource Context**:
- `resource_type`: `null` (global/company-level permission)
- `resource_id`: `null`

**Reason**: Lists all projects the user can view. User can see projects if:
- They have global `project:view` permission (sees all company projects), OR
- They are a member of specific projects (handled at data layer, not permission check)

**Check Location**: Before fetching projects in `ProjectService.fetchCompanyProjects()`

**Note**: The data layer should filter projects based on membership, but the permission check is global to ensure user has viewing rights.

---

### 3. **Get Single Project** - `GET /projects/:id`

**Permission**: `project:view`

**Resource Context**:
- `resource_type`: `"project"`
- `resource_id`: `projectId`

**Reason**: User needs permission to view this specific project. Checks both:
- Project-specific permission (user has `project:view` for this project)
- OR global permission (user has company-wide `project:view`)

**Check Location**: Before fetching project in `ProjectService.fetchProject()`

---

### 4. **Update Project** - `PUT /projects/:id`

**Permission**: `project:edit`

**Resource Context**:
- `resource_type`: `"project"`
- `resource_id`: `projectId`

**Reason**: User needs permission to edit this specific project.

**Check Location**: Before updating project in `ProjectService.updateProject()`

---

### 5. **Delete Project** - `DELETE /projects/:id`

**Permission**: `project:delete`

**Resource Context**:
- `resource_type`: `"project"`
- `resource_id`: `projectId`

**Reason**: User needs permission to delete this specific project.

**Check Location**: Before deleting project in `ProjectService.deleteProject()`

---

### 6. **Add Member** - `POST /projects/:id/members`

**Permission**: `project:edit`

**Resource Context**:
- `resource_type`: `"project"`
- `resource_id`: `projectId`

**Reason**: Managing members is considered part of editing the project. User needs `project:edit` permission.

**Check Location**: Before adding member in `ProjectService.addMember()`

---

### 7. **Remove Member** - `DELETE /projects/:id/members/:userId`

**Permission**: `project:edit`

**Resource Context**:
- `resource_type`: `"project"`
- `resource_id`: `projectId`

**Reason**: Managing members is considered part of editing the project. User needs `project:edit` permission.

**Check Location**: Before removing member in `ProjectService.removeMember()`

---

### 8. **List Members** - `GET /projects/:id/members` (TODO - needs to be implemented)

**Permission**: `project:view`

**Resource Context**:
- `resource_type`: `"project"`
- `resource_id`: `projectId`

**Reason**: Viewing members is part of viewing the project. User needs `project:view` permission.

**Check Location**: Before listing members (method needs to be created)

---

## Summary Table

| Operation | Endpoint | Permission | Resource Type | Resource ID |
|-----------|----------|------------|---------------|-------------|
| Create Project | `POST /projects` | `project:create` | `null` | `null` |
| List Projects | `GET /projects` | `project:view` | `null` | `null` |
| Get Project | `GET /projects/:id` | `project:view` | `"project"` | `projectId` |
| Update Project | `PUT /projects/:id` | `project:edit` | `"project"` | `projectId` |
| Delete Project | `DELETE /projects/:id` | `project:delete` | `"project"` | `projectId` |
| Add Member | `POST /projects/:id/members` | `project:edit` | `"project"` | `projectId` |
| Remove Member | `DELETE /projects/:id/members/:userId` | `project:edit` | `"project"` | `projectId` |
| List Members | `GET /projects/:id/members` | `project:view` | `"project"` | `projectId` |

---

## Implementation Notes

### Permission Check Helper

Create a helper method in `ProjectService`:

```typescript
private async checkPermission(
  userId: number,
  permissionSlug: string,
  resourceType: string | null,
  resourceId: number | null,
  companyId: number
): Promise<boolean> {
  // Call IAM Service HTTP/REST endpoint
  // POST /api/permissions/check
  // Returns true if user has permission, false otherwise
}
```

### Error Handling

If permission check fails:
- Throw `ClientErrorException` with status `403 Forbidden`
- Message: "You do not have permission to perform this action"

### Order of Operations

1. **Extract user info** from JWT (already done in auth middleware)
2. **Check permission** using IAM Service
3. **If permission granted** → Proceed with operation
4. **If permission denied** → Return 403 Forbidden

### Permission Check Location

- **Service Layer**: Perform permission checks in `ProjectService` methods
- **Before** the actual business logic/DB operations
- This keeps permission logic centralized and testable

