const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    location: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    leetcode: { type: String, default: '' },

    skills: [{ category: String, items: [String], _id: false }],
    education: [{ degree: String, school: String, year: String, _id: false }],

    // Resume file lives on Cloudinary; only the link + public id are stored here
    resumeUrl: { type: String, default: '' },
    // Optional external link (Drive, etc.), used when no file is uploaded or Cloudinary fails
    resumeLink: { type: String, default: '' },
    resumePublicId: { type: String, default: '' },
    resumeUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
