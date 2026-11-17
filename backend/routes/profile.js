const router = require('express').Router();
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

const EDITABLE = [
  'name', 'title', 'summary', 'location', 'email', 'phone',
  'github', 'linkedin', 'leetcode',
  'skills', 'education', 'resumeLink',
];

function publicView(doc) {
  if (!doc) return {};
  const o = doc.toObject();
  o.hasResumeFile = Boolean(o.resumeUrl);
  o.hasResume = Boolean(o.resumeUrl || o.resumeLink);
  delete o.resumeUrl;       // downloads go through /api/resume/download
  delete o.resumePublicId;
  return o;
}

// GET /api/profile  (public)
router.get('/', async (req, res) => {
  const profile = await Profile.findOne();
  res.json(publicView(profile));
});

// PUT /api/profile  (admin)  - resume fields are never touched here
router.put('/', auth, async (req, res) => {
  const update = {};
  for (const key of EDITABLE) if (key in req.body) update[key] = req.body[key];

  const profile = await Profile.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  });
  res.json(publicView(profile));
});

module.exports = router;
