const { randomUUID } = require('crypto');
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const repository = require('./repositories');
const { uploadBuffer } = require('./storage/objectStorage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false
}));

const upload = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass'
  }
});

async function uploadToObjectStorage(file, prefix) {
  if (!file) return null;
  const extension = path.extname(file.originalname || '');
  const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, '_');
  const key = `${safePrefix}/${randomUUID()}${extension}`;
  return uploadBuffer({
    key,
    buffer: file.buffer,
    contentType: file.mimetype
  });
}

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const existing = await repository.findUserByEmail(email);
  if (existing) return res.status(400).send('Email already exists');

  const hashed = await bcrypt.hash(password, 10);
  const token = Math.random().toString(36).substring(2);
  await repository.createUser({ email, password: hashed, token });

  const verifyUrl = `${req.protocol}://${req.get('host')}/verify?token=${token}`;
  await transporter.sendMail({
    from: 'noreply@example.com',
    to: email,
    subject: 'Verify your account',
    text: `Click to verify: ${verifyUrl}`
  }).catch(console.error);

  res.redirect('/auth.html');
});

app.get('/verify', async (req, res) => {
  const { token } = req.query;
  const user = await repository.verifyUserByToken(token);
  if (!user) return res.status(400).send('Invalid token');
  return res.send('Account verified');
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const user = await repository.findUserByEmail(email);
  if (!user) return res.status(400).send('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).send('Invalid credentials');
  if (!user.verified) return res.status(400).send('Please verify your email first');

  req.session.user = { email: user.email, id: user.id };
  res.redirect('/profile.html');
});

function authRequired(req, res, next) {
  if (!req.session.user) return res.redirect('/auth.html');
  return next();
}

app.post('/updateProfile', authRequired, upload.single('idUpload'), async (req, res) => {
  let objectInfo = null;
  if (req.file) {
    objectInfo = await uploadToObjectStorage(req.file, `profiles/${req.session.user.id || 'anonymous'}`);
  }

  const user = await repository.updateUserProfile(req.session.user.email, {
    phone: req.body.phone,
    familyPhone: req.body.familyPhone,
    age: req.body.age,
    address: req.body.address,
    idNumber: req.body.idNumber,
    idUploadKey: objectInfo && objectInfo.key,
    idUploadUrl: objectInfo && objectInfo.url
  });

  if (!user) return res.status(400).send('User not found');
  return res.redirect('/profile.html');
});

function adminRequired(req, res, next) {
  if (!req.session.user || req.session.user.email !== 'admin@example.com') {
    return res.status(403).send('Admin only');
  }
  return next();
}

app.post('/admin/jobs', adminRequired, async (req, res) => {
  const { title, location, type, description, companyId } = req.body;
  await repository.createCampaign({ title, location, type, description, companyId });
  res.redirect('/admin.html');
});

app.get('/jobs-data', async (req, res) => {
  const campaigns = await repository.listCampaigns();
  res.json(campaigns.map((c) => ({
    id: c.id,
    title: c.title,
    location: c.location,
    type: c.type,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt || c.created_at
  })));
});

app.get('/admin/applications-data', adminRequired, async (req, res) => {
  const apps = await repository.listApplicationsWithCampaign();
  res.json(apps);
});

const cpUpload = upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'license', maxCount: 1 },
  { name: 'schoolCert', maxCount: 1 }
]);

app.post('/apply', cpUpload, authRequired, async (req, res) => {
  const fileEntries = Object.entries(req.files || {});
  const uploadedFiles = {};

  for (const [fieldName, files] of fileEntries) {
    if (!files[0]) continue;
    const objectInfo = await uploadToObjectStorage(
      files[0],
      `applications/${req.session.user.id || 'anonymous'}/${fieldName}`
    );
    uploadedFiles[fieldName] = objectInfo;
  }

  const campaigns = await repository.listCampaigns();
  const campaign = campaigns.find((item) => item.id === req.body.jobId || item.id === req.body.campaignId);

  const application = await repository.createApplication({
    campaignId: req.body.jobId || req.body.campaignId,
    applicantId: req.session.user.id,
    companyId: campaign ? campaign.companyId || campaign.company_id : null,
    name: req.body.name,
    address: req.body.address,
    phone: req.body.phone,
    idNumber: req.body.idNumber,
    files: uploadedFiles
  });

  await repository.createStatusEvent({
    applicationId: application.id,
    applicantId: req.session.user.id,
    companyId: application.companyId || application.company_id,
    status: 'submitted',
    metadata: { source: 'apply-route' }
  });

  res.send('Application submitted');
});

app.get('/user', authRequired, async (req, res) => {
  const user = await repository.findUserByEmail(req.session.user.email);
  if (!user) return res.json({});
  const { password, token, ...data } = user;
  return res.json(data);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth.html');
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
