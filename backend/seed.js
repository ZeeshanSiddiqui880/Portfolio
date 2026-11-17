 
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Profile = require('./models/Profile');
const Project = require('./models/Project');
const Certificate = require('./models/Certificate');
const Experience = require('./models/Experience');
const data = require('./data/seedData.json');

const reset = process.argv.includes('--reset');

(async () => {
  await connectDB();

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');

  const admin = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (admin) {
    if (process.argv.includes('--reset-password')) {
      admin.password = ADMIN_PASSWORD;
      await admin.save();
      console.log('Admin password reset from .env');
    } else {
      console.log('Admin exists, password unchanged (use --reset-password to reset it from .env)');
    }
  } else {
    await Admin.create({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    console.log('Admin created');
  }

  if (reset) {
    // keep an already-uploaded resume link when resetting the profile
    const old = await Profile.findOne();
    await Profile.deleteMany({});
    await Project.deleteMany({});
    await Certificate.deleteMany({});
    await Experience.deleteMany({});
    if (old?.resumeUrl) {
      data.profile.resumeUrl = old.resumeUrl;
      data.profile.resumePublicId = old.resumePublicId;
      data.profile.resumeUpdatedAt = old.resumeUpdatedAt;
    }
    if (old?.resumeLink && !data.profile.resumeLink) data.profile.resumeLink = old.resumeLink;
    console.log('Profile and projects cleared');
  }

  if (!(await Profile.countDocuments())) {
    await Profile.create(data.profile);
    console.log('Profile loaded');
  } else {
    console.log('Profile already exists, skipped (use --reset to reload)');
  }

  if (!(await Project.countDocuments())) {
    await Project.insertMany(data.projects);
    console.log(`${data.projects.length} projects loaded`);
  } else {
    console.log('Projects already exist, skipped (use --reset to reload)');
  }

  if (!(await Experience.countDocuments())) {
    await Experience.insertMany(data.experience);
    console.log(`${data.experience.length} experience entries loaded`);
  } else {
    console.log('Experience already exists, skipped (use --reset to reload)');
  }

  if (!(await Certificate.countDocuments())) {
    await Certificate.insertMany(data.certificates);
    console.log(`${data.certificates.length} certificates loaded`);
  } else {
    console.log('Certificates already exist, skipped (use --reset to reload)');
  }

  await mongoose.disconnect();
  console.log('Done');
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
