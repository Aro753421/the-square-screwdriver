const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const APPS_FILE = path.join(DATA_DIR, 'applications.json');

function ensureFile(file) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
}

function loadJson(file) {
  ensureFile(file);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return [];
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function findUserByEmail(email) {
  return loadJson(USERS_FILE).find((u) => u.email === email) || null;
}

async function createUser({ email, password, token }) {
  const users = loadJson(USERS_FILE);
  const user = { email, password, verified: false, token };
  users.push(user);
  saveJson(USERS_FILE, users);
  return user;
}

async function verifyUserByToken(token) {
  const users = loadJson(USERS_FILE);
  const user = users.find((u) => u.token === token);
  if (!user) return null;
  user.verified = true;
  delete user.token;
  saveJson(USERS_FILE, users);
  return user;
}

async function updateUserProfile(email, profile) {
  const users = loadJson(USERS_FILE);
  const user = users.find((u) => u.email === email);
  if (!user) return null;
  Object.assign(user, profile);
  saveJson(USERS_FILE, users);
  return user;
}

async function createCampaign({ title, location, type, description }) {
  const jobs = loadJson(JOBS_FILE);
  const campaign = { id: Date.now().toString(), title, location, type, description, status: 'open' };
  jobs.push(campaign);
  saveJson(JOBS_FILE, jobs);
  return campaign;
}

async function listCampaigns() {
  return loadJson(JOBS_FILE);
}

async function createApplication(data) {
  const apps = loadJson(APPS_FILE);
  const application = { ...data, id: Date.now().toString(), status: 'submitted', createdAt: new Date().toISOString() };
  apps.push(application);
  saveJson(APPS_FILE, apps);
  return application;
}

async function listApplicationsWithCampaign() {
  const apps = loadJson(APPS_FILE);
  const jobs = loadJson(JOBS_FILE);
  return apps.map((a) => ({
    ...a,
    jobTitle: (jobs.find((j) => j.id === a.campaignId || j.id === a.jobId) || {}).title || 'N/A'
  }));
}

async function createStatusEvent() {
  return null;
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
