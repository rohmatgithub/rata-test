# Healthcare Scheduling System

A microservice-based healthcare scheduling system built with NestJS, GraphQL, PostgreSQL, and Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Application                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway Layer                               │
├──────────────────────────────────┬──────────────────────────────────────────┤
│                                  │                                           │
│  ┌────────────────────────┐      │      ┌────────────────────────────┐      │
│  │    Auth Service        │      │      │    Schedule Service         │      │
│  │    (Port: 3001)        │◄─────┼─────►│    (Port: 3002)             │      │
│  │                        │  validate   │                             │      │
│  │  - register            │    token    │  - Customer CRUD            │      │
│  │  - login               │             │  - Doctor CRUD              │      │
│  │  - validateToken       │             │  - Schedule CRUD            │      │
│  │  - refreshToken        │             │  - Conflict Detection       │      │
│  │  - logout              │             │                             │      │
│  └───────────┬────────────┘             └──────────────┬──────────────┘      │
│              │                                          │                     │
└──────────────┼──────────────────────────────────────────┼─────────────────────┘
               │                                          │
               ▼                                          ▼
┌──────────────────────────┐              ┌──────────────────────────┐
│   PostgreSQL (auth_db)   │              │ PostgreSQL (schedule_db) │
│   - users                │              │   - customers            │
│   - refresh_tokens       │              │   - doctors              │
└──────────────────────────┘              │   - schedules            │
                                          └──────────────────────────┘
```

## Tech Stack

| Component         | Technology               |
|-------------------|--------------------------|
| Backend Framework | NestJS                   |
| Frontend          | Next.js 15 (App Router)  |
| Database          | PostgreSQL               |
| API               | GraphQL (Apollo Server)  |
| Container         | Docker                   |
| ORM               | Prisma                   |
| Auth              | JWT + bcrypt             |
| Logging           | Pino (JSON format)       |
| Queue             | BullMQ (Redis-backed)    |
| Cache             | Redis (cache-manager)    |
| Email             | Nodemailer + Handlebars  |
| Styling           | Tailwind CSS             |

## Features

### Core Features
- User registration and authentication with JWT
- Customer, Doctor, and Schedule CRUD operations
- Schedule conflict detection
- Pagination and filtering
- GraphQL Playground with full documentation

#### Email Notification
- Email sent when schedule is created or deleted
- Async processing via BullMQ to avoid blocking API responses
- Beautiful HTML templates using Handlebars

#### Bull Queue
- Redis-backed job queue for reliable async processing
- Separate notification-service processes email jobs
- Job retry on failure

#### Unit Testing
- auth-service: 61%+ statement coverage
- schedule-service: 75%+ statement coverage
- Mocked dependencies (Prisma, Cache, Queue)

#### Redis Caching
- Doctor and Customer lookups cached for 60 seconds
- Schedule details cached
- Cache invalidation on updates/deletes

#### GraphQL Documentation
- All types, inputs, and fields have descriptions
- Accessible via GraphQL Playground introspection

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Run with Docker

```bash
# Clone and navigate to project
cd healthcare-scheduling

# Create .env file from example
cp .env.example .env

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Docker Compose Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start containers (uses existing images, no rebuild) |
| `docker compose up -d --build` | Rebuild images then start containers |
| `docker compose build` | Build images only (no start) |
| `docker compose build <service>` | Build specific service only |
| `docker compose down` | Stop containers (data persists in volumes) |
| `docker compose down -v` | Stop containers and delete volumes (fresh start) |

**When to rebuild?**
- After changing source code (`.ts`, `.js`)
- After changing `package.json` / dependencies
- After changing `Dockerfile`

```bash
# Rebuild specific services after code changes
docker compose build auth-service schedule-service
docker compose up -d

# Or rebuild all and start
docker compose up -d --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- Auth Service (GraphQL): http://localhost:3001/graphql
- Schedule Service (GraphQL): http://localhost:3002/graphql

### Local Development

```bash
# Start infrastructure only
docker-compose -f docker-compose.dev.yml up -d

# Auth Service
cd auth-service
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# Schedule Service (new terminal)
cd schedule-service
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Frontend Application

The frontend is built with Next.js 15 (App Router) and provides:

### Features
- User authentication (login/register)
- Dashboard with statistics
- Customer management (CRUD)
- Doctor management (CRUD)
- Schedule management (CRUD with conflict detection)

### Pages
| Route        | Description                          |
|--------------|--------------------------------------|
| `/`          | Redirect to login or dashboard       |
| `/login`     | User login page                      |
| `/register`  | User registration page               |
| `/dashboard` | Main dashboard with statistics       |
| `/customers` | Customer list and management         |
| `/doctors`   | Doctor list and management           |
| `/schedules` | Schedule list and management         |

### API Routes (BFF)
The frontend uses Next.js API routes as a Backend-for-Frontend (BFF) layer:

| Route                    | Method | Description              |
|--------------------------|--------|--------------------------|
| `/api/auth/login`        | POST   | User login               |
| `/api/auth/register`     | POST   | User registration        |
| `/api/auth/refresh`      | POST   | Refresh access token     |
| `/api/auth/logout`       | POST   | User logout              |
| `/api/customers`         | GET    | List customers           |
| `/api/customers`         | POST   | Create customer          |
| `/api/customers/[id]`    | GET    | Get customer by ID       |
| `/api/customers/[id]`    | PUT    | Update customer          |
| `/api/customers/[id]`    | DELETE | Delete customer          |
| `/api/doctors`           | GET    | List doctors             |
| `/api/doctors`           | POST   | Create doctor            |
| `/api/doctors/[id]`      | GET    | Get doctor by ID         |
| `/api/doctors/[id]`      | PUT    | Update doctor            |
| `/api/doctors/[id]`      | DELETE | Delete doctor            |
| `/api/schedules`         | GET    | List schedules           |
| `/api/schedules`         | POST   | Create schedule          |
| `/api/schedules/[id]`    | GET    | Get schedule by ID       |
| `/api/schedules/[id]`    | DELETE | Delete schedule          |

## Environment Variables

### Root `.env`

| Variable                 | Description              | Default   |
|--------------------------|--------------------------|-----------|
| POSTGRES_USER            | PostgreSQL username      | postgres  |
| POSTGRES_PASSWORD        | PostgreSQL password      | postgres  |
| POSTGRES_PORT            | PostgreSQL exposed port  | 5434      |
| REDIS_PORT               | Redis exposed port       | 6381      |
| JWT_SECRET               | JWT signing secret       | -         |
| JWT_EXPIRES_IN           | Access token expiry      | 15m       |
| REFRESH_TOKEN_EXPIRES_IN | Refresh token expiry     | 7d        |
| AUTH_SERVICE_PORT        | Auth service port        | 3001      |
| SCHEDULE_SERVICE_PORT    | Schedule service port    | 3002      |

## GraphQL API Examples

### Auth Service (Port 3001)

#### Register
```graphql
mutation {
  register(input: {
    email: "user@example.com"
    password: "securePassword123"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}
```

#### Login
```graphql
mutation {
  login(input: {
    email: "user@example.com"
    password: "securePassword123"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}
```

#### Validate Token
```graphql
query {
  validateToken(token: "your_jwt_token") {
    id
    email
  }
}
```

#### Refresh Token
```graphql
mutation {
  refreshToken(refreshToken: "your_refresh_token") {
    accessToken
    refreshToken
  }
}
```

### Schedule Service (Port 3002)

> All requests require `Authorization: Bearer <token>` header

#### Create Customer
```graphql
mutation {
  createCustomer(input: {
    name: "John Doe"
    email: "john@example.com"
  }) {
    id
    name
    email
  }
}
```

#### List Customers (with pagination)
```graphql
query {
  customers(pagination: { page: 1, limit: 10 }) {
    data {
      id
      name
      email
    }
    total
    page
    totalPages
  }
}
```

#### Create Doctor
```graphql
mutation {
  createDoctor(input: {
    name: "Dr. Smith"
  }) {
    id
    name
  }
}
```

#### Create Schedule
```graphql
mutation {
  createSchedule(input: {
    objective: "General Checkup"
    customerId: "customer-uuid"
    doctorId: "doctor-uuid"
    scheduledAt: "2026-06-10T09:00:00Z"
    duration: 30
  }) {
    id
    objective
    scheduledAt
    customer {
      name
    }
    doctor {
      name
    }
  }
}
```

#### List Schedules (with filter)
```graphql
query {
  schedules(
    pagination: { page: 1, limit: 10 }
    filter: {
      doctorId: "doctor-uuid"
      dateFrom: "2026-06-01"
      dateTo: "2026-06-30"
    }
  ) {
    data {
      id
      objective
      scheduledAt
      customer { name }
      doctor { name }
    }
    total
    totalPages
  }
}
```

## Project Structure

```
healthcare-scheduling/
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Development (infra only)
├── .env.example                # Environment template
├── init-db.sql                 # Database initialization
├── README.md                   # This file
│
├── auth-service/
│   ├── Dockerfile
│   ├── src/
│   │   ├── auth/               # Auth module (register, login, etc)
│   │   ├── prisma/             # Prisma service
│   │   └── common/             # Shared utilities
│   └── prisma/
│       └── schema.prisma       # User & RefreshToken models
│
└── schedule-service/
    ├── Dockerfile
    ├── src/
    │   ├── customer/           # Customer CRUD
    │   ├── doctor/             # Doctor CRUD
    │   ├── schedule/           # Schedule CRUD + conflict detection
    │   ├── prisma/             # Prisma service
    │   └── common/             # Guards, decorators, plugins
    └── prisma/
        └── schema.prisma       # Customer, Doctor, Schedule models
```

## API Authentication Flow

```
1. Client calls POST /graphql (Auth Service)
   └── register or login mutation
   └── Returns: accessToken + refreshToken

2. Client calls POST /graphql (Schedule Service)
   └── Header: Authorization: Bearer <accessToken>
   └── Schedule Service validates token with Auth Service
   └── If valid: process request
   └── If invalid: return UNAUTHENTICATED error

3. When accessToken expires:
   └── Client calls refreshToken mutation
   └── Returns: new accessToken + refreshToken
```

## Logging

Both services use structured JSON logging (Pino) with:

- `traceId` - Request correlation ID (passed via `X-Trace-Id` header)
- `service` - Service name
- `operation` - GraphQL operation name
- `userId` - Authenticated user ID
- `durationMs` - Request duration
- `error` - Error details (server-side only)

Example log:
```json
{
  "level": "info",
  "time": "2026-06-05T10:00:00.000Z",
  "traceId": "abc-123",
  "service": "schedule-service",
  "operation": "createSchedule",
  "userId": "user-uuid",
  "durationMs": 45,
  "status": "success"
}
```

## Error Codes

| Code                  | Description                    |
|-----------------------|--------------------------------|
| BAD_REQUEST           | Invalid input / validation     |
| UNAUTHENTICATED       | Missing or invalid token       |
| FORBIDDEN             | Insufficient permissions       |
| NOT_FOUND             | Resource not found             |
| CONFLICT              | Schedule time conflict         |
| INTERNAL_SERVER_ERROR | Unexpected server error        |

## Health Checks

Both services expose health check endpoints:

```bash
# Auth Service
curl http://localhost:3001/graphql?query=%7B__typename%7D

# Schedule Service
curl http://localhost:3002/graphql?query=%7B__typename%7D
```

## License

MIT
