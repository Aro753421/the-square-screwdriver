CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications ("applicantId");
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications ("companyId");
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications ("createdAt");

CREATE INDEX IF NOT EXISTS idx_status_events_status ON status_events (status);
CREATE INDEX IF NOT EXISTS idx_status_events_created_at ON status_events ("createdAt");
