const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  // Data extracted by AI
  patientName: { type: String, required: true },
  dateOfBirth: { type: Date },
  insuranceCompany: { type: String, required: true },
  policyNumber: { type: String },
  groupNumber: { type: String },
  proposedCptCodes: [{ type: String }], // Array of strings
  proposedIcdCodes: [{ type: String }], // Array of strings
  estimatedDenialRisk: { type: Number, min: 0, max: 1 }, // e.g., 0.15 for 15% risk

  // AI Metadata
  rawOCRText: { type: String }, // Store the raw text for debugging
  aiConfidence: { type: Number },

  // File storage paths (we'll store the uploaded files)
  insuranceCardImagePath: { type: String },
  clinicalDocImagePath: { type: String },

  // Status tracking
  status: {
    type: String,
    enum: ['processed', 'submitted', 'approved', 'denied', 'paid'],
    default: 'processed'
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  submittedAt: { type: Date }
});

module.exports = mongoose.model('Claim', ClaimSchema);