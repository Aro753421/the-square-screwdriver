const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: 'change_this_secret',
  resave: false,
  saveUninitialized: false
}));

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const APPS_FILE = path.join(DATA_DIR, 'applications.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(JOBS_FILE)) fs.writeFileSync(JOBS_FILE, '[]');
if (!fs.existsSync(APPS_FILE)) fs.writeFileSync(APPS_FILE, '[]');

const upload = multer({ dest: UPLOAD_DIR });

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch(e) { return []; }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const transporter = nodemailer.createTransport({
  // Configure your SMTP here
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass'
  }
});

// Sign up
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const users = loadJson(USERS_FILE);
  if (users.find(u => u.email === email)) return res.status(400).send('Email already exists');
  const hashed = await bcrypt.hash(password, 10);
  const token = Math.random().toString(36).substring(2);
  const user = { email, password: hashed, verified: false, token };
  users.push(user);
  saveJson(USERS_FILE, users);

  const verifyUrl = `${req.protocol}://${req.get('host')}/verify?token=${token}`;
  await transporter.sendMail({
    from: 'noreply@example.com',
    to: email,
    subject: 'Verify your account',
    text: `Click to verify: ${verifyUrl}`
  }).catch(console.error);

  res.redirect('/auth.html');
});

// Verify
app.get('/verify', (req, res) => {
  const { token } = req.query;
  const users = loadJson(USERS_FILE);
  const user = users.find(u => u.token === token);
  if (user) {
    user.verified = true;
    delete user.token;
    saveJson(USERS_FILE, users);
    res.send('Account verified');
  } else {
    res.status(400).send('Invalid token');
  }
});

// Sign in
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const users = loadJson(USERS_FILE);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).send('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).send('Invalid credentials');
  if (!user.verified) return res.status(400).send('Please verify your email first');
  req.session.user = user.email;
  res.redirect('/profile.html');
});

// Middleware for authenticated users
function authRequired(req, res, next) {
  if (!req.session.user) return res.redirect('/auth.html');
  next();
}

// Profile update
app.post('/updateProfile', authRequired, upload.single('idUpload'), (req, res) => {
  const users = loadJson(USERS_FILE);
  const user = users.find(u => u.email === req.session.user);
  if (!user) return res.status(400).send('User not found');
  user.phone = req.body.phone;
  user.familyPhone = req.body.familyPhone;
  user.age = req.body.age;
  user.address = req.body.address;
  user.idNumber = req.body.idNumber;
  user.idUpload = req.file ? req.file.filename : user.idUpload;
  saveJson(USERS_FILE, users);
  res.redirect('/profile.html');
});

// Admin middleware (simple check)
function adminRequired(req, res, next) {
  if (req.session.user !== 'admin@example.com') return res.status(403).send('Admin only');
  next();
}

// Add job
app.post('/admin/jobs', adminRequired, (req, res) => {
  const jobs = loadJson(JOBS_FILE);
  const { title, location, type, description } = req.body;
  jobs.push({ id: Date.now().toString(), title, location, type, description });
  saveJson(JOBS_FILE, jobs);
  res.redirect('/admin.html');
});

// Job listing
app.get('/jobs-data', (req, res) => {
  res.json(loadJson(JOBS_FILE));
});

// Job application form submission
const cpUpload = upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'license', maxCount: 1 },
  { name: 'schoolCert', maxCount: 1 }
]);
app.post('/apply', cpUpload, (req, res) => {
  const applications = loadJson(APPS_FILE);
  const appData = {
    jobId: req.body.jobId,
    name: req.body.name,
    address: req.body.address,
    phone: req.body.phone,
    idNumber: req.body.idNumber,
    files: req.files,
  };
  applications.push(appData);
  saveJson(APPS_FILE, applications);
  res.send('Application submitted');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
