# Centralized Logging & Correlation IDs (Local Stack)

This project includes a small, self‑hosted logging stack so you can see end‑to‑end request traces across services.

## Stack Overview

- **Loki**: log store (time‑series logs)
- **Promtail**: log shipper (tails Docker container logs and pushes to Loki)
- **Grafana**: UI to query and visualize logs

All three run via `docker-compose`:

- `loki`      → internal HTTP: `http://loki:3100`
- `promtail`  → scrapes `/var/lib/docker/containers/*/*.log`
- `grafana`   → proxy: `https://grafana.afeez-dev.local`, direct: `http://localhost:3009`
  - Default credentials: **admin / admin123**
  - Loki datasource is auto‑provisioned (`infra/grafana/provisioning/datasources/loki.yml`)

## Correlation IDs – How They’re Used

- A **correlation ID** is a unique ID (usually a UUID) that represents **one logical request** (e.g. “user logs in” or “user creates task”) across all services.
- At the **edge of the system** (first service that receives the request):
  - Try to read an incoming header like `X-Correlation-Id`.
  - If it’s missing, generate a new UUID.
  - Attach that value to:
    - The logging context (so every log line for that request includes it).
    - The outgoing HTTP headers to any downstream services.
    - The HTTP response headers, so clients can see it and reuse it (e.g. in bug reports).
- Each **downstream service**:
  - Reads `X-Correlation-Id` from the incoming request.
  - Reuses it in its own logs and passes it along to any other services it calls.
- In the **logging UI (Grafana + Loki)**:
  - You can search for a specific correlation ID and see **all log lines** from all services that participated in that request.
  - This makes it easy to:
    - Reconstruct the full path of a request (which services were hit, in what order).
    - Debug slow or failing requests by following one ID across the system.
    - Analyze performance and behavior per request without sifting through unrelated logs.

## How to Run the Logging Stack

From the project root:

```bash
make up        # or: make setup
```

This brings up:

- Core infra (MySQL, Redis, RabbitMQ, MinIO, Traefik)
- IAM (`iam-service` + `iam-nginx`)
- Logging stack (`loki`, `promtail`, `grafana`)

**After updating Promtail config** (e.g., to extract `correlation_id` as a label):

```bash
docker-compose restart promtail
```

This ensures Promtail picks up the new configuration and starts extracting `correlation_id` as a queryable label.

Make sure your `/etc/hosts` includes (copy/paste):

```text
127.0.0.1 grafana.afeez-dev.local
```

> Full host list is in `README.md` / `SETUP.md`.

Then open Grafana:

- Proxy (TLS, via Traefik): `https://grafana.afeez-dev.local`
- Direct: `http://localhost:3009`
- Login: `admin / admin123`

## How to Generate and Inspect Logs

### 1. Make a request with a correlation ID

**Option A: Provide your own correlation ID**

Example: login to IAM with a custom `X-Correlation-Id`:

```bash
CORR_ID="demo-corr-$(date +%s)"
curl -k -X POST "https://iam-service.afeez-dev.local/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: $CORR_ID" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -v 2>&1 | grep -i "x-correlation-id"
```

**Option B: Let IAM generate one (recommended)**

If you **omit** the `X-Correlation-Id` header, IAM will generate a UUID and return it in the response headers:

```bash
# Make request and capture correlation ID from response
CORR_ID=$(curl -k -s -X POST "https://iam-service.afeez-dev.local/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -D - | grep -i "x-correlation-id" | cut -d' ' -f2 | tr -d '\r\n')

echo "Correlation ID: $CORR_ID"
# Now use $CORR_ID to query logs in Grafana
```

**Keep that correlation ID** - you'll use it to trace the entire request flow across all services in Grafana.

### 2. Open Grafana Explore

In Grafana:

1. Go to **Explore** → choose datasource **Loki**.
2. Select a stream (left side), e.g. by label (it depends on your Docker labels), commonly:
   - `{container_name="task-iam-service"}` or similar.

### 3. Filter by correlation ID or message

**Query by correlation ID across ALL services:**

Use JSON field filtering to search across all services for a single request:

```logql
{container_name=~".+"} | json | correlation_id="6d66910f-a3d7-442f-8fa9-8917ca52da84"
```

This will show logs from **every service** that handled that request (IAM, API Gateway, Project Service, etc.), giving you a complete end-to-end trace.

**Alternative: Text search (works for all logs, even non-JSON):**

```logql
{container_name=~".+"} |= "6d66910f-a3d7-442f-8fa9-8917ca52da84"
```

**Query by correlation ID for a specific service:**

```logql
{container_name="task-iam-service", correlation_id="demo-corr-123"}
```

**Filter by message content (text search):**

```logql
{container_name="task-iam-service"} |= "auth_login_success"
```

**Filter by message type (using JSON field):**

```logql
{container_name="task-iam-service"} | json | message="auth_login_success"
```

You should see JSON log entries with fields like:

- `message` (e.g. `"auth_login_success"`)
- `correlation_id`
- `user_id`
- `company_id`
- `http_method`, `path`, timestamps, etc.

### 4. Complete workflow example

**Step 1:** Make a request and capture the correlation ID:

```bash
# Login request
RESPONSE=$(curl -k -s -X POST "https://iam-service.afeez-dev.local/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -D -)

# Extract correlation ID from response headers
CORR_ID=$(echo "$RESPONSE" | grep -i "x-correlation-id" | cut -d' ' -f2 | tr -d '\r\n')
echo "🔍 Correlation ID: $CORR_ID"
```

**Step 2:** Open Grafana Explore and query by correlation ID:

```logql
{correlation_id="<paste-your-correlation-id-here>"}
```

**Step 3:** You'll see all logs from that request across all services:
- IAM service logs (authentication, user lookup, etc.)
- API Gateway logs (routing, rate limiting, etc.)
- Downstream service logs (project creation, task assignment, etc.)

This gives you a **complete end-to-end trace** of a single user action!

### 5. Typical flows to inspect

- **Successful login**
  - `auth_login_success` with `user_id` + `company_id`.
- **Failed login**
  - `auth_login_failed` with attempted `email`.
- **Company registration**
  - `company_registered` with `company_id`, `company_name`, `user_id`, `user_email`.

Because the correlation ID is included in all logs for a request, once other services adopt the same pattern (Node microservices + API Gateway), you’ll be able to:

- Pass `X-Correlation-Id` from **frontend → API Gateway → Services**.
- Filter by that ID in Grafana and see the full cross‑service trace.

## Extending to Other Services (Pattern)

When we implement the Node services and API Gateway, we’ll mirror the same pattern:

- Express middleware that:
  - Reads or generates `X-Correlation-Id`.
  - Stores it on `req` and response headers.
  - Adds it to the logger context (e.g., `pino`, `winston`, or `console.log` wrapper).
- Structured JSON logs written to stdout.
- Promtail continues to scrape all service logs and send them to Loki.

This gives you **production‑style centralized logging** locally, with:

- One place (Grafana) to search logs from all services.
- Quick debugging by correlation ID for any user action. 


