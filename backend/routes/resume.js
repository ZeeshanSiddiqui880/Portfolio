const router = require('express').Router();
const { Readable } = require('stream');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const { resumeUpload } = require('../middleware/upload');
const { uploadBuffer, destroy } = require('../config/cloudinary');

// GET /api/resume/download (public)
// Streams the Cloudinary file; if there is no file or Cloudinary fails, falls back to the external link.
router.get('/download', async (req, res) => {
  const profile = await Profile.findOne();
  const link = profile?.resumeLink;
  if (!profile || (!profile.resumeUrl && !link)) {
    return res.status(404).json({ message: 'No resume available' });
  }

  if (profile.resumeUrl) {
    let upstream = null;
    try {
      upstream = await fetch(profile.resumeUrl);
    } catch (e) {
      upstream = null;
    }
    if (upstream && upstream.ok && upstream.body) {
      const ext = (profile.resumePublicId.match(/\.(pdf|docx?)$/i) || ['', 'pdf'])[1].toLowerCase();
      const safeName = (profile.name || 'resume').replace(/[^a-z0-9]+/gi, '_');
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Resume.${ext}"`);
      return Readable.fromWeb(upstream.body).pipe(res);
    }
  }

  if (link) return res.redirect(link);
  res.status(502).json({
    message:
      'Could not fetch resume from Cloudinary. If it is a PDF, enable "Allow delivery of PDF and ZIP files" in Cloudinary Settings > Security, or add an external resume link in the admin dashboard.',
  });
});

// POST /api/resume (admin) - upload new resume, replace old one
router.post('/', auth, resumeUpload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = (req.file.originalname.match(/\.(pdf|docx?)$/i) || ['', 'pdf'])[1].toLowerCase();
  let result;
  try {
    result = await uploadBuffer(req.file.buffer, {
      resource_type: 'raw',
      folder: 'portfolio/resume',
      public_id: `resume-${Date.now()}.${ext}`,
    });
  } catch (e) {
    return res.status(502).json({
      message: 'Cloudinary upload failed. Check your Cloudinary keys, or save an external resume link instead.',
    });
  }

  let profile = await Profile.findOne();
  if (!profile) profile = new Profile();
  const oldId = profile.resumePublicId;

  profile.resumeUrl = result.secure_url;
  profile.resumePublicId = result.public_id;
  profile.resumeUpdatedAt = new Date();
  await profile.save();

  if (oldId) await destroy(oldId, 'raw');
  res.json({ hasResumeFile: true, resumeUpdatedAt: profile.resumeUpdatedAt });
});

// DELETE /api/resume (admin) - removes the uploaded file (the external link is cleared via PUT /api/profile)
router.delete('/', auth, async (req, res) => {
  const profile = await Profile.findOne();
  if (!profile || !profile.resumeUrl) return res.status(404).json({ message: 'No uploaded resume to delete' });

  await destroy(profile.resumePublicId, 'raw');
  profile.resumeUrl = '';
  profile.resumePublicId = '';
  profile.resumeUpdatedAt = undefined;
  await profile.save();
  res.json({ hasResumeFile: false });
});

module.exports = router;
