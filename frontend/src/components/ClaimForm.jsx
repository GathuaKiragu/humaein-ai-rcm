import React, { useState } from 'react';
import axios from 'axios';
import {
  Upload,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  RotateCw,
  X,
  ImageIcon,
  FileIcon
} from 'lucide-react';

const ClaimForm = ({ onClaimCreated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [claimData, setClaimData] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState({
    insuranceCard: null,
    clinicalDoc: null
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, fieldName) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFiles(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const removeFile = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!files.insuranceCard || !files.clinicalDoc) {
      setMessage('Please upload both files');
      return;
    }

    setIsProcessing(true);
    setMessage('AI is analyzing your documents...');

    const formData = new FormData();
    formData.append('insurance_card', files.insuranceCard);
    formData.append('clinical_doc', files.clinicalDoc);

    try {
      const response = await axios.post('http://localhost:5000/api/claims', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Claim processed successfully!');
      setClaimData(response.data.claim);

      if (onClaimCreated) {
        onClaimCreated(response.data.claim);
      }

    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage('Error processing claim. Please check your files and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const FileUploadArea = ({ fieldName, title, description, accept }) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {title}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${files[fieldName] ? 'border-green-300 bg-green-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => handleDrop(e, fieldName)}
      >
        <input
          type="file"
          name={fieldName}
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleFileChange(e, fieldName)}
          disabled={isProcessing}
        />

        {files[fieldName] ? (
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 truncate">
                {files[fieldName].name}
              </p>
              <p className="text-xs text-gray-500">
                {(files[fieldName].size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeFile(fieldName)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Claim Processing</h2>
        <p className="text-gray-600">Upload documents and let our AI extract and validate claim data automatically</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Progress Bar */}
        {isProcessing && (
          <div className="w-full bg-gray-200 h-1">
            <div className="bg-blue-600 h-1 animate-pulse transition-all duration-3000" style={{ width: '90%' }}></div>
          </div>
        )}

        <div className="p-8">
          {!claimData ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FileUploadArea
                  fieldName="insuranceCard"
                  title="Insurance Card"
                  description="PNG, JPG, PDF up to 10MB"
                  accept="image/*,.pdf"
                  icon={<ImageIcon className="h-5 w-5" />}
                />

                <FileUploadArea
                  fieldName="clinicalDoc"
                  title="Clinical Document"
                  description="PNG, JPG, PDF up to 10MB"
                  accept="image/*,.pdf"
                  icon={<FileIcon className="h-5 w-5" />}
                />
              </div>

              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-blue-700">
                  Supported formats: JPG, PNG, PDF. Maximum file size: 10MB per file.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !files.insuranceCard || !files.clinicalDoc}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <RotateCw className="h-5 w-5 animate-spin" />
                    <span>Processing with AI...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    <span>Process Claim with AI</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Claim Processed Successfully!</h3>
              <p className="text-gray-600 mb-8">AI has extracted and validated your claim data</p>

              {/* Results Card */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Extracted Data</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Patient Information</h5>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Name:</span> {claimData.patientName || 'Not found'}</p>
                      <p className="text-sm"><span className="font-medium">DOB:</span> {claimData.dateOfBirth ? new Date(claimData.dateOfBirth).toLocaleDateString() : 'Not found'}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Insurance Details</h5>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Company:</span> {claimData.insuranceCompany || 'Not found'}</p>
                      <p className="text-sm"><span className="font-medium">Policy #:</span> {claimData.policyNumber || 'Not found'}</p>
                      <p className="text-sm"><span className="font-medium">Group #:</span> {claimData.groupNumber || 'Not found'}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Medical Codes</h5>
                    <div className="flex flex-wrap gap-1">
                      {claimData.proposedCptCodes?.map((code, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Risk Assessment</h5>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${claimData.estimatedDenialRisk > 0.5
                        ? 'bg-red-100 text-red-700'
                        : claimData.estimatedDenialRisk > 0.2
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                      {(claimData.estimatedDenialRisk * 100).toFixed(1)}% Denial Risk
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => {
                    setFiles({ insuranceCard: null, clinicalDoc: null });
                    setClaimData(null);
                    setMessage('');
                  }}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Process Another Claim
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {message && !claimData && (
            <div className={`mt-6 p-4 rounded-lg flex items-center space-x-3 ${message.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
              {message.includes('Error') ? (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <RotateCw className="h-5 w-5 flex-shrink-0 animate-spin" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimForm;