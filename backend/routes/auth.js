const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, try again later' },
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, email: admin.email });
});

// GET /api/auth/me  (token check)
router.get('/me', auth, (req, res) => res.json({ ok: true }));

// PUT /api/auth/password  (admin) - change own password
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }
  const admin = await Admin.findById(req.admin.id).select('+password');
  if (!admin || !(await admin.matchPassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  admin.password = newPassword; // hashed by the model's pre-save hook
  await admin.save();
  res.json({ message: 'Password changed' });
});

module.exports = router;
