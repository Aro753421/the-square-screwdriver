CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  token TEXT,
  phone TEXT,
  "familyPhone" TEXT,
  age INTEGER,
  address TEXT,
  "idNumber" TEXT,
  "idUploadKey" TEXT,
  "idUploadUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  "companyId" TEXT REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  location TEXT,
  type TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  "campaignId" TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  "applicantId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "companyId" TEXT REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  "idNumber" TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_events (
  id TEXT PRIMARY KEY,
  "applicationId" TEXT REFERENCES applications(id) ON DELETE CASCADE,
  "applicantId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "companyId" TEXT REFERENCES companies(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
