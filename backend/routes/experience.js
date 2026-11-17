const router = require('express').Router();
const mongoose = require('mongoose');
const Experience = require('../models/Experience');
const auth = require('../middleware/auth');
const { certUpload } = require('../middleware/upload');
const { uploadBuffer, destroy } = require('../config/cloudinary');

const KINDS = ['certificate', 'lor'];
const upload = certUpload.fields(KINDS.map((name) => ({ name, maxCount: 1 })));

const splitLines = (v) =>
  Array.isArray(v) ? v : String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);

function parseBody(b) {
  const data = {
    role: b.role,
    company: b.company,
    period: b.period,
    order: Number(b.order) || 0,
    bullets: b.bullets === undefined ? undefined : splitLines(b.bullets),
  };
  KINDS.forEach((k) => (data[`${k}Link`] = b[`${k}Link`]));
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  return data;
}

// Uploads every provided file first, so a failure leaves existing files untouched
async function saveFiles(files = {}) {
  const out = {};
  try {
    for (const k of KINDS) {
      const f = files[k]?.[0];
      if (!f) continue;
      const r = await uploadBuffer(f.buffer, {
        folder: `portfolio/experience/${k}`,
        resource_type: 'auto',
      });
      out[`${k}FileUrl`] = r.secure_url;
      out[`${k}FilePublicId`] = r.public_id;
      out[`${k}FileType`] = r.resource_type;
    }
  } catch (e) {
    const err = new Error(
      'Cloudinary upload failed. Check your Cloudinary keys, or save the document as an external link instead.'
    );
    err.status = 502;
    throw err;
  }
  return out;
}

const clearKind = (k) => ({
  [`${k}FileUrl`]: '',
  [`${k}FilePublicId`]: '',
  [`${k}FileType`]: 'image',
});

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ message: 'Invalid id' });

// GET /api/experience (public)
router.get('/', async (req, res) => {
  res.json(await Experience.find().sort({ order: 1, createdAt: -1 }));
});

// POST /api/experience (admin)
router.post('/', auth, upload, async (req, res) => {
  const data = parseBody(req.body);
  if (!data.role) return res.status(400).json({ message: 'Role is required' });
  Object.assign(data, await saveFiles(req.files));
  res.status(201).json(await Experience.create(data));
});

// PUT /api/experience/:id (admin)
router.put('/:id', auth, validId, upload, async (req, res) => {
  const exp = await Experience.findById(req.params.id);
  if (!exp) return res.status(404).json({ message: 'Experience not found' });

  const data = parseBody(req.body);
  const uploaded = await saveFiles(req.files);

  for (const k of KINDS) {
    const replaced = uploaded[`${k}FileUrl`];
    const removed = req.body[`remove_${k}`] === 'true';
    if (replaced || removed) await destroy(exp[`${k}FilePublicId`], exp[`${k}FileType`]);
    if (removed && !replaced) Object.assign(data, clearKind(k));
  }
  Object.assign(data, uploaded);

  exp.set(data);
  await exp.save();
  res.json(exp);
});

// DELETE /api/experience/:id (admin)
router.delete('/:id', auth, validId, async (req, res) => {
  const exp = await Experience.findByIdAndDelete(req.params.id);
  if (!exp) return res.status(404).json({ message: 'Experience not found' });
  for (const k of KINDS) await destroy(exp[`${k}FilePublicId`], exp[`${k}FileType`]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
