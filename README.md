# THE SQUARE SCREWDRIVER

This repository contains a simple job portal for drilling platform workers. The site allows users to register, verify their email, apply for jobs, and provides a basic admin panel to add job vacancies.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure SMTP credentials for email verification by setting environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
3. Start the server:
   ```bash
   npm start
   ```
4. Visit `http://localhost:3000/index.html` in your browser.

The initial admin account is `admin@example.com`. Any user signed in with this email will be able to access `admin.html` to add job vacancies.

To sign out, visit `/logout` or use the **Log Out** link visible in the navigation bar once you are logged in. Your profile page now automatically loads your saved information.
npm install
