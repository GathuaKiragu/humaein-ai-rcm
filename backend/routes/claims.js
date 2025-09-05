const express = require('express');
const multer = require('multer');
const Claim = require('../models/Claim');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Use absolute path
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// POST /api/claims - Process new claim with AI
router.post('/', upload.fields([
  { name: 'insuranceCard', maxCount: 1 },
  { name: 'clinicalDoc', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Files received:', req.files);

    if (!req.files || !req.files.insuranceCard || !req.files.clinicalDoc) {
      return res.status(400).json({ error: 'Both insurance card and clinical document are required' });
    }

    // Create FormData to send to AI service
    const formData = new FormData();
    
    // Read files and create Blobs for sending
    const insuranceCardBuffer = fs.readFileSync(req.files.insuranceCard[0].path);
    const clinicalDocBuffer = fs.readFileSync(req.files.clinicalDoc[0].path);
    
    // Create Blobs (for Node.js, we'll use alternative approach)
    const insuranceCardBlob = new Blob([insuranceCardBuffer], { 
      type: req.files.insuranceCard[0].mimetype 
    });
    const clinicalDocBlob = new Blob([clinicalDocBuffer], { 
      type: req.files.clinicalDoc[0].mimetype 
    });

    formData.append('insurance_card', insuranceCardBlob, req.files.insuranceCard[0].originalname);
    formData.append('clinical_doc', clinicalDocBlob, req.files.clinicalDoc[0].originalname);

    // 1. Send files to the AI Service for processing
    const aiServiceResponse = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/process-documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const aiData = aiServiceResponse.data;

    if (!aiData.success) {
      // Clean up uploaded files if AI processing fails
      fs.unlinkSync(req.files.insuranceCard[0].path);
      fs.unlinkSync(req.files.clinicalDoc[0].path);
      
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
      rawOCRText: aiData.raw_text,
      insuranceCardImagePath: `/uploads/${path.basename(req.files.insuranceCard[0].path)}`,
      clinicalDocImagePath: `/uploads/${path.basename(req.files.clinicalDoc[0].path)}`,
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
    
    // Clean up files if error occurs
    if (req.files) {
      if (req.files.insuranceCard) {
        fs.unlinkSync(req.files.insuranceCard[0].path);
      }
      if (req.files.clinicalDoc) {
        fs.unlinkSync(req.files.clinicalDoc[0].path);
      }
    }
    
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

// GET /api/claims/:id - Get a specific claim
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// DELETE /api/claims/:id - Delete a claim and its files
router.delete('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Delete associated files
    if (claim.insuranceCardImagePath) {
      const insuranceCardPath = path.join(__dirname, '../public', claim.insuranceCardImagePath);
      if (fs.existsSync(insuranceCardPath)) {
        fs.unlinkSync(insuranceCardPath);
      }
    }
    
    if (claim.clinicalDocImagePath) {
      const clinicalDocPath = path.join(__dirname, '../public', claim.clinicalDocImagePath);
      if (fs.existsSync(clinicalDocPath)) {
        fs.unlinkSync(clinicalDocPath);
      }
    }

    await Claim.findByIdAndDelete(req.params.id);
    res.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete claim' });
  }
});

module.exports = router;