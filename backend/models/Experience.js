const mongoose = require('mongoose');

// Each document slot (certificate, LOR) can have an uploaded Cloudinary file,
// an external link, or both. All are optional.
const doc = (name) => ({
  [`${name}FileUrl`]: { type: String, default: '' },
  [`${name}FilePublicId`]: { type: String, default: '' },
  [`${name}FileType`]: { type: String, default: 'image' },
  [`${name}Link`]: { type: String, default: '' },
});

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, trim: true },
    company: { type: String, default: '' },
    period: { type: String, default: '' },
    bullets: [String],
    order: { type: Number, default: 0 },
    ...doc('certificate'),
    ...doc('lor'),
  },
  { timestamps: true }
);

module.exports = mongoose.model('Experience', experienceSchema);
