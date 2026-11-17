const router = require('express').Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');
const { certUpload } = require('../middleware/upload');
const { uploadBuffer, destroy } = require('../config/cloudinary');

function parseBody(b) {
  const data = {
    title: b.title,
    issuer: b.issuer,
    issueDate: b.issueDate,
    link: b.link,
    order: Number(b.order) || 0,
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return data;
}

async function saveFile(file) {
  try {
    const r = await uploadBuffer(file.buffer, {
      folder: 'portfolio/certificates',
      resource_type: 'auto',
    });
    return { fileUrl: r.secure_url, filePublicId: r.public_id, fileResourceType: r.resource_type };
  } catch (e) {
    const err = new Error(
      'Cloudinary upload failed. Check your Cloudinary keys, or save the certificate with an external link instead.'
    );
    err.status = 502;
    throw err;
  }
}

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ message: 'Invalid id' });

// GET /api/certificates (public)
router.get('/', async (req, res) => {
  res.json(await Certificate.find().sort({ order: 1, createdAt: -1 }));
});

// POST /api/certificates (admin)
router.post('/', auth, certUpload.single('file'), async (req, res) => {
  const data = parseBody(req.body);
  if (!data.title) return res.status(400).json({ message: 'Title is required' });
  if (req.file) Object.assign(data, await saveFile(req.file));
  res.status(201).json(await Certificate.create(data));
});

// PUT /api/certificates/:id (admin)
router.put('/:id', auth, validId, certUpload.single('file'), async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) return res.status(404).json({ message: 'Certificate not found' });

  const data = parseBody(req.body);
  if (req.file) {
    const uploaded = await saveFile(req.file); // upload first, so a failure keeps the old file
    await destroy(cert.filePublicId, cert.fileResourceType);
    Object.assign(data, uploaded);
  } else if (req.body.removeFile === 'true') {
    await destroy(cert.filePublicId, cert.fileResourceType);
    Object.assign(data, { fileUrl: '', filePublicId: '', fileResourceType: 'image' });
  }
  cert.set(data);
  await cert.save();
  res.json(cert);
});

// DELETE /api/certificates/:id (admin)
router.delete('/:id', auth, validId, async (req, res) => {
  const cert = await Certificate.findByIdAndDelete(req.params.id);
  if (!cert) return res.status(404).json({ message: 'Certificate not found' });
  await destroy(cert.filePublicId, cert.fileResourceType);
  res.json({ message: 'Deleted' });
});

module.exports = router;
