# Auth Service

Authentication microservice untuk Healthcare Scheduling System.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| API | GraphQL |
| Auth | JWT + Refresh Token |

## Port

```
http://localhost:3001/graphql
```

## Database Schema

```
┌─────────────────────┐       ┌─────────────────────────┐
│       users         │       │     refresh_tokens      │
├─────────────────────┤       ├─────────────────────────┤
│ id: UUID (PK)       │◄──────│ id: UUID (PK)           │
│ email: String       │       │ token: String (unique)  │
│ password: String    │       │ userId: UUID (FK)       │
│ createdAt: DateTime │       │ expiresAt: DateTime     │
│ updatedAt: DateTime │       │ createdAt: DateTime     │
└─────────────────────┘       └─────────────────────────┘
```

## GraphQL API

### Mutations

| Mutation | Input | Output | Description |
|----------|-------|--------|-------------|
| `register` | `{ email, password }` | `AuthResponse` | Registrasi user baru |
| `login` | `{ email, password }` | `AuthResponse` | Login dan dapat token |
| `refreshToken` | `refreshToken: String` | `RefreshTokenResponse` | Generate access token baru |
| `logout` | `refreshToken: String` | `Boolean` | Invalidate refresh token |

### Queries

| Query | Input | Output | Description |
|-------|-------|--------|-------------|
| `validateToken` | `token: String` | `User` | Validasi token, return user info |

### Types

```graphql
type User {
  id: ID!
  email: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AuthResponse {
  accessToken: String!
  refreshToken: String!
  user: User!
}

type RefreshTokenResponse {
  accessToken: String!
  refreshToken: String!
}
```

## Authentication Flow

### Login Flow

```
Client                              Auth Service
   │                                     │
   │  login(email, password)             │
   │ ───────────────────────────────────>│
   │                                     │ 1. Find user by email
   │                                     │ 2. Verify password (bcrypt)
   │                                     │ 3. Generate accessToken (JWT, 15m)
   │                                     │ 4. Generate refreshToken (UUID, 7d)
   │                                     │ 5. Store refreshToken in DB
   │                                     │
   │  { accessToken, refreshToken, user }│
   │ <───────────────────────────────────│
```

### Token Validation Flow

```
Schedule Service                    Auth Service
       │                                 │
       │  validateToken(accessToken)     │
       │ ───────────────────────────────>│
       │                                 │ 1. Verify JWT signature
       │                                 │ 2. Check expiry
       │                                 │ 3. Get user from DB
       │                                 │
       │  { id, email, createdAt, ... }  │
       │ <───────────────────────────────│
```

### Refresh Token Flow (with Rotation)

```
Client                              Auth Service
   │                                     │
   │  refreshToken(refreshToken)         │
   │ ───────────────────────────────────>│
   │                                     │ 1. Find refreshToken in DB
   │                                     │ 2. Check not expired (< 7d)
   │                                     │ 3. Delete old refreshToken
   │                                     │ 4. Generate new accessToken
   │                                     │ 5. Generate new refreshToken
   │                                     │ 6. Store new refreshToken in DB
   │                                     │
   │  { accessToken, refreshToken }      │
   │ <───────────────────────────────────│
```

## Token Strategy

| Token | Type | Expiry | Storage | Purpose |
|-------|------|--------|---------|---------|
| Access Token | JWT | 15 menit | Client only | API authorization |
| Refresh Token | UUID | 7 hari | PostgreSQL + Client | Generate new access token |

### JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Refresh Token Rotation

Setiap kali `refreshToken` dipanggil:

1. Token lama **dihapus** dari database
2. Token baru dibuat dengan expiry **7 hari dari sekarang**
3. Menggunakan **sliding expiration** - selama user aktif refresh sebelum expired, tidak perlu login ulang

```
Day 1:  Login   → refreshToken "AAA" expires Day 8
Day 5:  Refresh → refreshToken "BBB" expires Day 12, "AAA" deleted
Day 10: Refresh → refreshToken "CCC" expires Day 17, "BBB" deleted
```

### Token Validation (Current)

| Check | Method | Implemented |
|-------|--------|-------------|
| Signature valid | JWT verify | Yes |
| Token not expired | JWT exp claim | Yes |
| User exists | PostgreSQL query | Yes |
| Token blacklisted | Redis lookup | No (future) |

## Security Rules

| Rule | Implementation |
|------|----------------|
| Password hashing | bcrypt (10 rounds) |
| Unique email | Database constraint |
| Token signature | HMAC SHA256 |
| Refresh token single-use | Rotation on refresh |
| Input validation | class-validator |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry | `7d` |

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/auth_db?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

## Project Structure

```
auth-service/
├── prisma/
│   ├── migrations/
│   │   └── 20260604_init/
│   └── schema.prisma
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── auth.response.ts    # AuthResponse, RefreshTokenResponse types
│   │   │   ├── login.input.ts      # LoginInput
│   │   │   ├── register.input.ts   # RegisterInput
│   │   │   ├── user.model.ts       # User type
│   │   │   └── index.ts
│   │   ├── auth.module.ts
│   │   ├── auth.resolver.ts        # GraphQL resolvers
│   │   └── auth.service.ts         # Business logic
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
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

### Register

```graphql
mutation {
  register(input: { 
    email: "user@example.com", 
    password: "password123" 
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      createdAt
    }
  }
}
```

### Login

```graphql
mutation {
  login(input: { 
    email: "user@example.com", 
    password: "password123" 
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

### Validate Token

```graphql
query {
  validateToken(token: "eyJhbGciOiJIUzI1NiIs...") {
    id
    email
    createdAt
    updatedAt
  }
}
```

### Refresh Token

```graphql
mutation {
  refreshToken(refreshToken: "uuid-refresh-token") {
    accessToken
    refreshToken
  }
}
```

### Logout

```graphql
mutation {
  logout(refreshToken: "uuid-refresh-token")
}
```

## Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| Redis token blacklist | Instant logout invalidation | High |
| Rate limiting | Prevent brute force attacks | High |
| Cache validateToken | Reduce DB calls | Medium |
| Password reset | Email-based reset flow | Medium |
| Email verification | Verify email on register | Low |
