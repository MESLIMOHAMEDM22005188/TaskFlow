# Grindly on Alwaysdata

## Architecture

- Frontend: React + Vite, built into `frontend/dist`
- Backend: Node.js + Express, started as an Alwaysdata **Service**
- Database: MySQL / MariaDB
- Email: Alwaysdata mailbox through SMTP using Nodemailer
- Media: Cloudinary

## Alwaysdata Service (backend 24/7)

Create the service in **Advanced > Services**.

Recommended configuration:

- Working directory: `/home/grindlyy/www/TaskFlow/backend`
- Command: `node app.js`
- Run in foreground; do not daemonize or fork the process
- Node.js: use the account's Node.js 20+ runtime
- Environment variables: `NODE_ENV=production`, `PORT=8300`, `HOST=::`

Alwaysdata Services must listen on IPv6 address `::` and use an available port in the range `8300-8499`. Choose the same port in the service configuration and the backend environment.

The service is exposed on the account's services hostname and selected port. If the public website domain must proxy requests to this service, configure that routing separately in the website/HTTP server settings; creating a Service alone does not automatically map the website domain to it.

Service logs are available in the Alwaysdata administration panel and under `/home/grindlyy/admin/logs/services/`.

## Backend environment variables

Set these in the backend service environment or in the backend's private `.env` file. Never commit `.env`.

```dotenv
NODE_ENV=production
PORT=8300
HOST=::

DATABASE_URL=mysql://user:password@mysql-example.alwaysdata.net:3306/database_name
DB_HOST=mysql-example.alwaysdata.net
DB_PORT=3306
DB_NAME=database_name
DB_USER=user
DB_PASS=replace-with-database-password
DB_CONNECTION_LIMIT=10

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp-example.alwaysdata.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mailbox@example.alwaysdata.net
SMTP_PASS=replace-with-mailbox-password
EMAIL_FROM="Grindly <mailbox@example.alwaysdata.net>"

APP_URL=https://your-app.alwaysdata.net
CORS_ALLOWED_ORIGINS=https://your-app.alwaysdata.net

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=replace-with-cloudinary-api-secret
UPLOAD_DIR=uploads
LOG_LEVEL=info
```

## Database migrations

Apply the SQL migrations once, against the production database, after checking the current schema:

1. `backend/migrations/20261112_email_verification.sql`
2. `backend/migrations/20261112_password_reset_codes.sql`

The first migration adds email verification for new accounts. The second stores password-reset code hashes and expiry data. Back up the database before applying migrations.

## Build and deployment

Build the frontend locally or in GitHub Actions:

```bash
cd frontend
npm ci
npm run build
```

Install backend dependencies in an environment with enough resources:

```bash
cd backend
npm ci --omit=dev
```

Then restart the Alwaysdata Service from **Advanced > Services**.

## Verification

- `GET /api/health` returns JSON with `ok: true`
- Sign up sends a six-digit verification code through Alwaysdata SMTP
- Resend verification sends a new code
- Forgot password sends a six-digit reset code through Alwaysdata SMTP
- Resetting the password invalidates active reset codes
- Authenticated password change still requires the current password

## Security

- Keep `.env` out of Git.
- Rotate any credential that has been exposed.
- Use a long, unique JWT secret.
- Do not print environment variables in terminal logs or support messages.
- Services are publicly reachable; protect every application endpoint with authentication and rate limits where appropriate.
