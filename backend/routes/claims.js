const express = require('express');
const multer = require('multer');
const Claim = require('../models/Claim');
const axios = require('axios'); // To call the AI service
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // Files will be saved in 'public/uploads/'
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});
const upload = multer({ storage: storage });

// POST /api/claims - Process new claim with AI
router.post('/', upload.fields([
  { name: 'insuranceCard', maxCount: 1 },
  { name: 'clinicalDoc', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Files received:', req.files);

    // 1. Send files to the AI Service for processing
    const aiServiceResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/process-documents`,
      {
        insurance_card: req.files.insuranceCard[0],
        clinical_doc: req.files.clinicalDoc[0]
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const aiData = aiServiceResponse.data;

    if (!aiData.success) {
      return res.status(500).json({ error: 'AI processing failed', details: aiData.error });
    }

    // 2. Create a new Claim in the database with the AI-processed data
    const newClaim = new Claim({
      patientName: aiData.data.patient_name,
      dateOfBirth: aiData.data.date_of_birth,
      insuranceCompany: aiData.data.insurance_company,
      policyNumber: aiData.data.policy_number,
      groupNumber: aiData.data.group_number,
      proposedCptCodes: aiData.data.proposed_cpt_codes,
      proposedIcdCodes: aiData.data.proposed_icd_codes,
      estimatedDenialRisk: aiData.data.estimated_denial_risk,
      rawOCRText: aiData.raw_text, // For debugging
      insuranceCardImagePath: req.files.insuranceCard[0].path,
      clinicalDocImagePath: req.files.clinicalDoc[0].path,
      status: 'processed'
    });

    const savedClaim = await newClaim.save();

    // 3. Send the saved claim data back to the frontend
    res.json({
      message: 'Claim processed successfully!',
      claim: savedClaim
    });

  } catch (error) {
    console.error('Error in claim processing:', error);
    res.status(500).json({ error: 'Internal server error during claim processing' });
  }
});

// GET /api/claims - Get all claims for the dashboard
router.get('/', async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 }); // Newest first
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

module.exports = router;