const { randomUUID } = require('crypto');
const pool = require('../db/pool');

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0] || null;
}

async function createUser({ email, password, token }) {
  const id = randomUUID();
  const result = await pool.query(
    `INSERT INTO users (id, email, password, verified, token)
     VALUES ($1, $2, $3, false, $4)
     RETURNING *`,
    [id, email, password, token]
  );
  return result.rows[0];
}

async function verifyUserByToken(token) {
  const result = await pool.query(
    `UPDATE users
     SET verified = true, token = NULL, "updatedAt" = NOW()
     WHERE token = $1
     RETURNING *`,
    [token]
  );
  return result.rows[0] || null;
}

async function updateUserProfile(email, profile) {
  const result = await pool.query(
    `UPDATE users
     SET phone = $2,
         "familyPhone" = $3,
         age = $4,
         address = $5,
         "idNumber" = $6,
         "idUploadKey" = COALESCE($7, "idUploadKey"),
         "idUploadUrl" = COALESCE($8, "idUploadUrl"),
         "updatedAt" = NOW()
     WHERE email = $1
     RETURNING *`,
    [
      email,
      profile.phone || null,
      profile.familyPhone || null,
      profile.age || null,
      profile.address || null,
      profile.idNumber || null,
      profile.idUploadKey || null,
      profile.idUploadUrl || null
    ]
  );
  return result.rows[0] || null;
}

async function createCampaign({ title, location, type, description, companyId }) {
  const id = randomUUID();
  const resolvedCompanyId = companyId || null;
  const result = await pool.query(
    `INSERT INTO campaigns (id, "companyId", title, location, type, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'open')
     RETURNING *`,
    [id, resolvedCompanyId, title, location, type, description]
  );
  return result.rows[0];
}

async function listCampaigns() {
  const result = await pool.query('SELECT * FROM campaigns ORDER BY "createdAt" DESC');
  return result.rows;
}

async function createApplication({ campaignId, applicantId, companyId, name, address, phone, idNumber, files }) {
  const id = randomUUID();
  const result = await pool.query(
    `INSERT INTO applications (
      id, "campaignId", "applicantId", "companyId", name, address, phone, "idNumber", status, files
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted', $9::jsonb)
    RETURNING *`,
    [id, campaignId, applicantId || null, companyId || null, name, address, phone, idNumber, JSON.stringify(files || {})]
  );
  return result.rows[0];
}

async function listApplicationsWithCampaign() {
  const result = await pool.query(
    `SELECT a.*, c.title AS "jobTitle"
     FROM applications a
     LEFT JOIN campaigns c ON c.id = a."campaignId"
     ORDER BY a."createdAt" DESC`
  );
  return result.rows;
}

async function createStatusEvent({ applicationId, applicantId, companyId, status, metadata }) {
  const id = randomUUID();
  const result = await pool.query(
    `INSERT INTO status_events (id, "applicationId", "applicantId", "companyId", status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING *`,
    [id, applicationId, applicantId || null, companyId || null, status, JSON.stringify(metadata || {})]
  );
  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
  verifyUserByToken,
  updateUserProfile,
  createCampaign,
  listCampaigns,
  createApplication,
  listApplicationsWithCampaign,
  createStatusEvent
};
