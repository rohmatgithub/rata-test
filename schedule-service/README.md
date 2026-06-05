# Schedule Service

Scheduling microservice untuk Healthcare Scheduling System. Menangani manajemen Customer, Doctor, dan Schedule.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| API | GraphQL |
| Auth | JWT (via Auth Service) |

## Port

```
http://localhost:3002/graphql
```

## Database Schema

```
┌─────────────────────┐
│     customers       │
├─────────────────────┤
│ id: UUID (PK)       │───────────────┐
│ name: VARCHAR(100)  │               │
│ email: VARCHAR(255) │               │
│ createdAt: TIMESTAMP│               │
│ updatedAt: TIMESTAMP│               │
└─────────────────────┘               │
                                      │
┌─────────────────────┐               │
│      doctors        │               │
├─────────────────────┤               │
│ id: UUID (PK)       │───────┐       │
│ name: VARCHAR(100)  │       │       │
│ createdAt: TIMESTAMP│       │       │
│ updatedAt: TIMESTAMP│       │       │
└─────────────────────┘       │       │
                              │       │
┌─────────────────────────────▼───────▼─┐
│            schedules                   │
├────────────────────────────────────────┤
│ id: UUID (PK)                          │
│ objective: VARCHAR(500)                │
│ customerId: UUID (FK) ─────────────────│
│ doctorId: UUID (FK) ───────────────────│
│ scheduledAt: TIMESTAMP                 │
│ duration: SMALLINT (minutes)           │
│ createdAt: TIMESTAMP                   │
│ updatedAt: TIMESTAMP                   │
└────────────────────────────────────────┘
```

## Authentication

Semua endpoint memerlukan JWT token dari Auth Service.

```
┌────────┐       ┌──────────────────┐       ┌──────────────┐
│ Client │──────>│ Schedule Service │──────>│ Auth Service │
│        │       │                  │       │              │
│        │ Authorization: Bearer <token>    │ validateToken│
└────────┘       └──────────────────┘       └──────────────┘
```

**Flow:**
1. Client kirim request dengan header `Authorization: Bearer <token>`
2. Schedule Service memanggil Auth Service `validateToken`
3. Jika valid → lanjut proses
4. Jika tidak valid → return 401 Unauthorized

## GraphQL API

### Customer Module

#### Mutations

| Mutation | Input | Output | Description |
|----------|-------|--------|-------------|
| `createCustomer` | `CreateCustomerInput` | `Customer` | Buat customer baru |
| `updateCustomer` | `UpdateCustomerInput` | `Customer` | Update customer |
| `deleteCustomer` | `id: ID` | `Boolean` | Hapus customer |

#### Queries

| Query | Input | Output | Description |
|-------|-------|--------|-------------|
| `customers` | `PaginationInput` | `CustomersResponse` | List customers dengan pagination |
| `customer` | `id: ID` | `Customer` | Get customer by ID |

### Doctor Module

#### Mutations

| Mutation | Input | Output | Description |
|----------|-------|--------|-------------|
| `createDoctor` | `CreateDoctorInput` | `Doctor` | Buat doctor baru |
| `updateDoctor` | `UpdateDoctorInput` | `Doctor` | Update doctor |
| `deleteDoctor` | `id: ID` | `Boolean` | Hapus doctor |

#### Queries

| Query | Input | Output | Description |
|-------|-------|--------|-------------|
| `doctors` | `PaginationInput` | `DoctorsResponse` | List doctors dengan pagination |
| `doctor` | `id: ID` | `Doctor` | Get doctor by ID |

### Schedule Module

#### Mutations

| Mutation | Input | Output | Description |
|----------|-------|--------|-------------|
| `createSchedule` | `CreateScheduleInput` | `Schedule` | Buat jadwal baru |
| `deleteSchedule` | `id: ID` | `Boolean` | Hapus jadwal |

#### Queries

| Query | Input | Output | Description |
|-------|-------|--------|-------------|
| `schedules` | `PaginationInput`, `ScheduleFilterInput` | `SchedulesResponse` | List schedules dengan filter & pagination |
| `schedule` | `id: ID` | `Schedule` | Get schedule by ID |

### Input Types

```graphql
input CreateCustomerInput {
  name: String!      # min 2 chars
  email: String!     # valid email format
}

input UpdateCustomerInput {
  id: ID!
  name: String
  email: String
}

input CreateDoctorInput {
  name: String!      # min 2 chars
}

input UpdateDoctorInput {
  id: ID!
  name: String
}

input CreateScheduleInput {
  objective: String!   # min 3 chars
  customerId: ID!      # must exist
  doctorId: ID!        # must exist
  scheduledAt: String! # ISO 8601 format
  duration: Int = 30   # minutes, min 15
}

input ScheduleFilterInput {
  customerId: ID
  doctorId: ID
  dateFrom: String     # ISO 8601 format
  dateTo: String       # ISO 8601 format
}

input PaginationInput {
  page: Int = 1        # min 1
  limit: Int = 10      # min 1, max 100
}
```

### Response Types

```graphql
type Customer {
  id: ID!
  name: String!
  email: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Doctor {
  id: ID!
  name: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Schedule {
  id: ID!
  objective: String!
  customerId: ID!
  customer: Customer!
  doctorId: ID!
  doctor: Doctor!
  scheduledAt: DateTime!
  duration: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type CustomersResponse {
  data: [Customer!]!
  total: Int!
  page: Int!
  limit: Int!
  totalPages: Int!
}

type DoctorsResponse {
  data: [Doctor!]!
  total: Int!
  page: Int!
  limit: Int!
  totalPages: Int!
}

type SchedulesResponse {
  data: [Schedule!]!
  total: Int!
  page: Int!
  limit: Int!
  totalPages: Int!
}
```

## Business Rules

### Customer
- Email harus unique
- Nama minimal 2 karakter

### Doctor
- Nama minimal 2 karakter

### Schedule
- **Customer dan Doctor harus valid** (ada di database)
- **Tidak boleh ada jadwal bentrok** untuk dokter yang sama pada waktu yang overlap
- Duration dalam menit, minimal 15 menit
- Objective minimal 3 karakter

### Schedule Conflict Detection

```
Existing:  |-------- 09:00 - 09:30 --------|
                                            
Conflict:      |---- 09:15 - 09:45 ----|     ❌ Overlap
Conflict:  |-------- 09:00 - 09:30 --------|  ❌ Same time
Conflict:  |-- 08:45 - 09:15 --|              ❌ Overlap start
OK:                                |-- 09:30 - 10:00 --| ✓ After
OK:        |-- 08:00 - 08:30 --|                         ✓ Before
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Service port | `3002` |
| `AUTH_SERVICE_URL` | URL Auth Service untuk validasi token | - |

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5434/schedule_db?schema=public"
PORT=3002
AUTH_SERVICE_URL="http://localhost:3001"
```

## Project Structure

```
schedule-service/
├── prisma/
│   ├── migrations/
│   │   └── 20260604_init/
│   └── schema.prisma
├── src/
│   ├── common/
│   │   ├── common.module.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts         # JWT validation via Auth Service
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── dto/
│   │       └── pagination.input.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── customer/
│   │   ├── dto/
│   │   │   ├── customer.model.ts
│   │   │   ├── create-customer.input.ts
│   │   │   ├── update-customer.input.ts
│   │   │   ├── customers.response.ts
│   │   │   └── index.ts
│   │   ├── customer.module.ts
│   │   ├── customer.service.ts
│   │   └── customer.resolver.ts
│   ├── doctor/
│   │   ├── dto/
│   │   │   ├── doctor.model.ts
│   │   │   ├── create-doctor.input.ts
│   │   │   ├── update-doctor.input.ts
│   │   │   ├── doctors.response.ts
│   │   │   └── index.ts
│   │   ├── doctor.module.ts
│   │   ├── doctor.service.ts
│   │   └── doctor.resolver.ts
│   ├── schedule/
│   │   ├── dto/
│   │   │   ├── schedule.model.ts
│   │   │   ├── create-schedule.input.ts
│   │   │   ├── schedule-filter.input.ts
│   │   │   ├── schedules.response.ts
│   │   │   └── index.ts
│   │   ├── schedule.module.ts
│   │   ├── schedule.service.ts
│   │   └── schedule.resolver.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── .env.example
├── package.json
└── README.md
```

## Running the Service

```bash
# Install dependencies
npm install

# Run database migration
npx prisma migrate dev

# Start development server
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

## Example GraphQL Queries

### Customer

```graphql
# Create Customer
mutation {
  createCustomer(input: { 
    name: "John Doe", 
    email: "john@example.com" 
  }) {
    id
    name
    email
    createdAt
  }
}

# Get All Customers
query {
  customers(pagination: { page: 1, limit: 10 }) {
    data {
      id
      name
      email
    }
    total
    totalPages
  }
}

# Get Customer by ID
query {
  customer(id: "uuid-here") {
    id
    name
    email
  }
}

# Update Customer
mutation {
  updateCustomer(input: { 
    id: "uuid-here", 
    name: "John Updated" 
  }) {
    id
    name
  }
}

# Delete Customer
mutation {
  deleteCustomer(id: "uuid-here")
}
```

### Doctor

```graphql
# Create Doctor
mutation {
  createDoctor(input: { name: "Dr. Smith" }) {
    id
    name
  }
}

# Get All Doctors
query {
  doctors(pagination: { page: 1, limit: 10 }) {
    data {
      id
      name
    }
    total
  }
}
```

### Schedule

```graphql
# Create Schedule
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
    customer { name }
    doctor { name }
    scheduledAt
    duration
  }
}

# Get Schedules with Filter
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
      customer { name }
      doctor { name }
      scheduledAt
      duration
    }
    total
  }
}

# Get Schedule by ID
query {
  schedule(id: "uuid-here") {
    id
    objective
    customer { name email }
    doctor { name }
    scheduledAt
    duration
  }
}

# Delete Schedule
mutation {
  deleteSchedule(id: "uuid-here")
}
```

## Database Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| customers | email_key | email | Unique constraint |
| schedules | customerId_idx | customerId | FK lookup |
| schedules | doctorId_idx | doctorId | FK lookup |
| schedules | scheduledAt_idx | scheduledAt | Date range queries |
| schedules | doctorId_scheduledAt_idx | doctorId, scheduledAt | Conflict detection |

## Error Responses

| Error | Status | Condition |
|-------|--------|-----------|
| `Authorization header is missing` | 401 | No token provided |
| `Invalid or expired token` | 401 | Token validation failed |
| `Customer not found` | 404 | Customer ID not exists |
| `Doctor not found` | 404 | Doctor ID not exists |
| `Schedule not found` | 404 | Schedule ID not exists |
| `Customer with this email already exists` | 409 | Duplicate email |
| `Doctor already has a schedule at this time` | 409 | Schedule conflict |

## Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| Redis caching | Cache doctor/customer lists | High |
| Email notification | Send email on schedule create/delete | High |
| Bull queue | Background job for email | Medium |
| Update schedule | Allow rescheduling | Medium |
| Recurring schedules | Weekly/monthly appointments | Low |
