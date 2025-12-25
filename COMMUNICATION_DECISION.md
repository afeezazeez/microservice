# Communication Pattern Decision: Project Service → IAM Service

## Question
Should Project Service use **HTTP/REST** or **gRPC** to communicate with IAM Service?

## Decision: **gRPC for Permission Checks Only**

### Summary

**Decision**: Use **gRPC** ONLY for:
- ✅ **Permission checks** (Project Service → IAM Service)

**HTTP/REST** for everything else:
- ✅ Role assignments/removals (service-to-service HTTP)
- ✅ User management (CRUD operations)
- ✅ Token validation
- ✅ Frontend → API Gateway → Services (all user-facing APIs)
- ✅ All other service-to-service calls

### Rationale

#### ✅ Why gRPC for Permission Checks Only

1. **High-Frequency Operation**:
   - Permission checks happen on **every** authenticated request
   - Multiple services will call IAM for permission checks frequently
   - This is the single highest-frequency IAM operation

2. **Low Latency Requirements**:
   - Permission checks need to be fast (<1ms ideally)
   - gRPC uses HTTP/2 multiplexing and binary protocol
   - Performance benefit justifies the added complexity for this one operation

3. **Simple Operation**:
   - Permission checks are simple: input (user_id, permission), output (true/false)
   - Perfect use case for gRPC's efficiency

#### ✅ Why HTTP/REST for Everything Else

1. **Simplicity**: 
   - Easier debugging with standard HTTP tools (curl, Postman, browser)
   - JSON is human-readable
   - Standard REST APIs are well-understood

2. **Existing Infrastructure**:
   - API Gateway already uses HTTP reverse proxy
   - All services communicate via HTTP
   - Consistent communication pattern across services

3. **Better Tooling**:
   - Swagger documentation
   - Postman collections
   - Easier testing and integration

4. **Flexibility**:
   - Easy to version APIs (`/api/v1/`, `/api/v2/`)
   - Can handle different content types (JSON, form-data, etc.)
   - Easier to integrate with frontend and third-party services

5. **Performance is Sufficient**:
   - Role assignments, user management, etc. are lower frequency
   - HTTP overhead is negligible for these operations
   - Not worth the added complexity of gRPC

---

## Communication Pattern Summary

| Operation Type | Protocol | Reason |
|---------------|----------|--------|
| **Permission checks** | **gRPC** | High frequency, low latency, simple operation |
| Role assignments | **HTTP/REST** | Lower frequency, service-to-service |
| Get user roles | **HTTP/REST** | Service-to-service, REST is sufficient |
| User invite/create | **HTTP/REST** | User-facing, REST semantics |
| User CRUD | **HTTP/REST** | User-facing, REST semantics |
| User login/register | **HTTP/REST** | User-facing, lower frequency |
| Project/Task CRUD | **HTTP/REST** | User-facing APIs |

### Infrastructure Setup

**Proto Files**: Already exist at `infra/grpc/iam.proto`
- Contains `PermissionService` with `CheckPermission` and `CheckPermissions` methods
- This is exactly what we need!

**Implementation Plan:**
1. ✅ Set up gRPC server in IAM Service (Laravel) - **PermissionService only**
2. ✅ Generate gRPC client for Project Service (Node.js)
3. ✅ Implement permission check via gRPC
4. ✅ Keep role management, user management, etc. as HTTP/REST

### FAANG-Level Perspective

**FAANG companies typically use gRPC for:**
- High-throughput internal services (millions of requests/sec)
- Services that need streaming (chat, notifications)
- Services with strict latency requirements

**FAANG companies use HTTP/REST for:**
- External-facing APIs
- Services with lower traffic
- Prototyping and MVP stages
- Services that need easy debugging

**Our Current State:**
- We're in early stage (MVP/prototype)
- Low-to-moderate traffic expected
- HTTP/REST is the right choice now
- Can migrate to gRPC later if needed

---

## Implementation

### gRPC for Permission Checks

**Project Service → IAM Service (gRPC):**

```typescript
// Permission Check (gRPC)
import { PermissionServiceClient } from './grpc/iam_grpc_pb';
import { CheckPermissionRequest } from './grpc/iam_pb';
import * as grpc from '@grpc/grpc-js';

const client = new PermissionServiceClient(
  'iam-service:50051',
  grpc.credentials.createInsecure()
);

const request = new CheckPermissionRequest();
request.setUserId(userId);
request.setPermissionSlug('project:edit');
request.setResourceType('project');
request.setResourceId(projectId);

const hasPermission = await new Promise((resolve, reject) => {
  client.checkPermission(request, (error, response) => {
    if (error) reject(error);
    else resolve(response.getAllowed());
  });
});
```

### HTTP/REST for Everything Else

**Project Service → IAM Service (HTTP/REST):**

```typescript
// Role Assignment (HTTP/REST)
await axios.post('https://iam-service.afeez-dev.local/api/roles/assign', {
  user_id: userId,
  role_slug: 'project-manager',
  resource_type: 'project',
  resource_id: projectId,
  company_id: companyId
});

// Get User Roles (HTTP/REST)
const response = await axios.get(
  `https://iam-service.afeez-dev.local/api/users/${userId}/roles`,
  { params: { resource_type: 'project', resource_id: projectId } }
);
```

---

## Summary

| Aspect | HTTP/REST | gRPC |
|--------|-----------|------|
| **Simplicity** | ✅ Simple | ❌ More complex |
| **Performance** | ✅ Good enough | ✅ Better |
| **Tooling** | ✅ Excellent | ⚠️ Limited |
| **Debugging** | ✅ Easy | ❌ Harder |
| **Current Fit** | ✅ Perfect | ⚠️ Overkill |
| **Future Ready** | ✅ Can migrate | ✅ Future-proof |

**Decision**: 

✅ **Use gRPC ONLY for permission checks** - high-frequency, simple operation
✅ **Use HTTP/REST for everything else** - role management, user management, all other operations
✅ **Proto files already exist** - `PermissionService` is ready to implement
✅ **Right tool for the right job** - gRPC where it matters most (permission checks), HTTP/REST everywhere else

This approach balances **performance** (gRPC for the highest-frequency operation) with **simplicity** (HTTP/REST for everything else that doesn't need the added complexity).

---

## Proto Files Status

✅ **Proto files exist and ready**:
- `infra/grpc/iam.proto` - IAM service definitions

**Defined Services:**
- `PermissionService`: `CheckPermission`, `CheckPermissions`
- `AuthService`: `ValidateToken` (for future use)

**Next Steps:**
1. Implement gRPC server in IAM Service (Laravel)
2. Generate gRPC client stubs for Node.js services
3. Update Project Service to use gRPC for permission checks

