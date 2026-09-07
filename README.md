# Express Backend API With Prisma and TypeScript

## Author:

## Description:

An Express-based RESTful API with TypeScript and Prisma , managing both authentication and CRUD operations.

## Features

- [x] MVC Pattern
- [x] Prima as ORM
- [x] Seed Script
- [x] Authentication Routes (/Login , /Logout)
- [x] JWT (HTTP-Only)
- [x] Protected Routes
- [x] Validation With Zod as middleware
- [x] Error Handler middleware :
  - [x] Prisma Errors
  - [x] Zod Errors
  - [x] JWT Parsing Errors
  - [x] Route Not Found Error
- [x] CRUD Operations ( Author , Books resources)
- [x] Custom Handler for Response
- [x] Custom HTTP Codes enum list
- [x] CORS Middleware with custom config object

## Icoming Features

- [ ] API Documentation Using Swagger

- [ ] Sanitize queries against SQL Injection and XSS

- [x] Middlewrae logger

- [ ] Testing

## Getting Started

#### Clone the repo:

```bash
git clone <repository-url>
```

#### Install dependencies:

```bash
npm install
```

#### Set environment variables:

```bash
cp .env.example .env
```

## Public clash join

`POST /api/clashes/:id/join` is public. No JWT cookie is required.

```json
{
  "username": "learn_with_sam",
  "platform": "INSTAGRAM"
}
```

Authenticated user flows (`/api/support`, payments, reports, `/api/auth/*`) are unchanged.

## Running Locally

```bash
npm run dev
```

## Running in Production

```bash
npm run start
```

## Contributions

Contributions are welcome! Feel free to submit issues, feature requests, or pull requests to enhance the functionality or fix any issues.
# clash-creators-backend
