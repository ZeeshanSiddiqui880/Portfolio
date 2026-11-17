const router = require('express').Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { imageUpload } = require('../middleware/upload');
const { uploadBuffer, destroy } = require('../config/cloudinary');

const splitList = (v, sep) =>
  Array.isArray(v) ? v : String(v || '').split(sep).map((s) => s.trim()).filter(Boolean);

// Accepts multipart/form-data from the admin form
function parseBody(b) {
  const data = {
    title: b.title,
    description: b.description,
    githubUrl: b.githubUrl,
    liveUrl: b.liveUrl,
    featured: b.featured === 'true' || b.featured === true,
    order: Number(b.order) || 0,
    techStack: splitList(b.techStack, ','),
    bullets: splitList(b.bullets, '\n'),
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return data;
}

async function saveImage(file) {
  const r = await uploadBuffer(file.buffer, { folder: 'portfolio/projects', resource_type: 'image' });
  return { imageUrl: r.secure_url, imagePublicId: r.public_id };
}

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ message: 'Invalid id' });

// GET /api/projects  (public)
router.get('/', async (req, res) => {
  res.json(await Project.find().sort({ order: 1, createdAt: -1 }));
});

// POST /api/projects  (admin)
router.post('/', auth, imageUpload.single('image'), async (req, res) => {
  const data = parseBody(req.body);
  if (!data.title) return res.status(400).json({ message: 'Title is required' });
  if (req.file) Object.assign(data, await saveImage(req.file));
  res.status(201).json(await Project.create(data));
});

// PUT /api/projects/:id  (admin)
router.put('/:id', auth, validId, imageUpload.single('image'), async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const data = parseBody(req.body);
  if (req.file) {
    await destroy(project.imagePublicId);
    Object.assign(data, await saveImage(req.file));
  } else if (req.body.removeImage === 'true') {
    await destroy(project.imagePublicId);
    data.imageUrl = '';
    data.imagePublicId = '';
  }
  project.set(data);
  await project.save();
  res.json(project);
});

// DELETE /api/projects/:id  (admin)
router.delete('/:id', auth, validId, async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  await destroy(project.imagePublicId);
  res.json({ message: 'Deleted' });
});

module.exports = router;
