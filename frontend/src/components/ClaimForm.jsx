import React, { useState } from 'react';
import axios from 'axios';

const ClaimForm = ({ onClaimCreated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [claimData, setClaimData] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setMessage('AI is analyzing your documents...');

    const formData = new FormData();
    const insuranceCardFile = event.target.insuranceCard.files[0];
    const clinicalDocFile = event.target.clinicalDoc.files[0];

    formData.append('insuranceCard', insuranceCardFile);
    formData.append('clinicalDoc', clinicalDocFile);

    try {
      const response = await axios.post('http://localhost:5000/api/claims', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Claim processed successfully!');
      setClaimData(response.data.claim);
      
      // Notify parent component about the new claim
      if (onClaimCreated) {
        onClaimCreated(response.data.claim);
      }
      
      console.log('Claim created:', response.data.claim);
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage('Error processing claim. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">New AI-Powered Claim</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Insurance Card (Image)
          </label>
          <input
            type="file"
            name="insuranceCard"
            accept="image/*"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinical Document (Image/PDF)
          </label>
          <input
            type="file"
            name="clinicalDoc"
            accept="image/*,.pdf"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isProcessing}
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Process with AI'}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {claimData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-semibold mb-3">Extracted Data</h3>
          <p><strong>Patient:</strong> {claimData.patientName}</p>
          <p><strong>Insurance:</strong> {claimData.insuranceCompany}</p>
          <p><strong>Policy #:</strong> {claimData.policyNumber}</p>
          <p><strong>CPT Codes:</strong> {claimData.proposedCptCodes?.join(', ')}</p>
          <p><strong>Denial Risk:</strong> {(claimData.estimatedDenialRisk * 100).toFixed(1)}%</p>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Process Another Claim
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaimForm;