require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// make async route errors reach the error handler (Express 4)
const wrap = (router) => {
  router.stack.forEach((layer) => {
    if (!layer.route) return;
    layer.route.stack.forEach((l) => {
      const fn = l.handle;
      if (fn.length <= 3) l.handle = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    });
  });
  return router;
};

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', wrap(require('./routes/auth')));
app.use('/api/profile', wrap(require('./routes/profile')));
app.use('/api/projects', wrap(require('./routes/projects')));
app.use('/api/resume', wrap(require('./routes/resume')));
app.use('/api/certificates', wrap(require('./routes/certificates')));
app.use('/api/experience', wrap(require('./routes/experience')));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status =
    err.status || (err.name === 'MulterError' || /must be|Only image/.test(err.message) ? 400 : 500);
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on :${PORT}`)))
  .catch((e) => {
    console.error('Startup failed:', e.message);
    process.exit(1);
  });
