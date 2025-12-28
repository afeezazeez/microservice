# Testing Guide

This document outlines how to run tests for each service in the microservices architecture.

## Running Tests

### Using Make (Recommended)

Run tests for any service using the simplified Make command:

```bash
# Run tests for a specific service
make test iam-service
make test project-service
make test notification-service
```

### IAM Service (Laravel/PHPUnit)

The IAM service uses Laravel's PHPUnit for testing. Tests run in a Docker container with an in-memory SQLite database.

**Run tests:**
```bash
# Using Make (recommended)
make test iam-service

# Or manually
docker-compose exec iam-service composer test
```

This command:
- Runs tests inside the IAM service container
- Uses an in-memory SQLite database
- Configures test environment variables (silent logs, array cache, etc.)
- Executes `composer test` (which runs PHPUnit)

### Downstream Services (Node.js/Vitest)

All downstream services (API Gateway, Project Service, Task Service, Notification Service, etc.) use Vitest for testing.

**Run tests using Make:**
```bash
# Run tests in Docker container
make test project-service
make test notification-service
```

**Or run tests locally (faster for development):**
```bash
# Navigate to the service directory
cd services/<service-name>

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Examples

**IAM Service:**
```bash
make test iam-service
```

**Project Service:**
```bash
# Using Make
make test project-service

# Or locally
cd services/project-service
npm run test
```

**Notification Service:**
```bash
# Using Make
make test notification-service

# Or locally
cd services/notification-service
npm run test
```

## Notes

- IAM service tests run in Docker containers to ensure consistent environment
- Downstream service tests can run in Docker (via Make) or locally for faster iteration
- All services use mocking to isolate units and avoid external dependencies
- Tests automatically silence logs during execution
- Use `make test [service-name]` for consistent testing across all services


