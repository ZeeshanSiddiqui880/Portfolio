const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, default: '' },
    issueDate: { type: String, default: '' },
    // External link (Drive, Credly, issuer site...). Works even if Cloudinary is down.
    link: { type: String, default: '' },
    // Optional uploaded file on Cloudinary
    fileUrl: { type: String, default: '' },
    filePublicId: { type: String, default: '' },
    fileResourceType: { type: String, default: 'image' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
