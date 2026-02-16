# THE SQUARE SCREWDRIVER

This repository contains a simple job portal for drilling platform workers. The site allows users to register, verify their email, apply for jobs, and provides a basic admin panel to add job vacancies.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure PostgreSQL and run migrations:
   ```bash
   export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/screwdriver'
   npm run migrate
   ```
3. Configure SMTP credentials for email verification by setting environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
4. Configure object storage (S3-compatible) for uploads:
   - `S3_BUCKET` (required)
   - `S3_REGION`
   - `S3_ENDPOINT` (required for non-AWS providers)
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_PUBLIC_BASE_URL` (optional CDN/custom domain)
5. Start the server:
   ```bash
   npm start
   ```
6. Visit `http://localhost:3000/index.html` in your browser.

The initial admin account is `admin@example.com`. Any user signed in with this email will be able to access `admin.html` to add job vacancies.

To sign out, visit `/logout` or use the **Log Out** link visible in the navigation bar once you are logged in.
