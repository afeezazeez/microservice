# Testing Guide

This document outlines how to run tests for each service in the microservices architecture.

## IAM Service (Laravel/PHPUnit)

The IAM service uses Laravel's PHPUnit for testing. Tests run in a Docker container with an in-memory SQLite database.

**Run tests:**
```bash
# From the microservices root folder
make iam-test
```

This command:
- Runs tests inside the IAM service container
- Uses an in-memory SQLite database
- Configures test environment variables (silent logs, array cache, etc.)
- Executes `composer test` (which runs PHPUnit)

## Downstream Services (Node.js/Vitest)

All downstream services (API Gateway, Project Service, Task Service, etc.) use Vitest for testing.

**Run tests:**
```bash
# Navigate to the service directory
cd services/<service-name>

# Run tests locally
npm run test
```

### Examples

**API Gateway:**
```bash
cd services/api-gateway
npm run test
```

**Project Service:**
```bash
cd services/project-service
npm run test
```

**Task Service:**
```bash
cd services/task-service
npm run test
```

## Notes

- IAM service tests run in Docker containers to ensure consistent environment
- Downstream service tests run locally for faster iteration during development
- All services use mocking to isolate units and avoid external dependencies
- Tests automatically silence logs during execution


