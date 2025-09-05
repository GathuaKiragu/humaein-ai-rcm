import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClaimForm from './components/ClaimForm';
import { 
  BarChart3, 
  FileText, 
  PlusCircle, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Shield
} from 'lucide-react';
import './App.css';

function App() {
  const [claims, setClaims] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    highRisk: 0,
    successRate: 0,
    totalValue: 0
  });

  // Fetch all claims for the dashboard
  const fetchClaims = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/claims');
      setClaims(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (claimsData) => {
    const total = claimsData.length;
    const processed = claimsData.filter(c => c.status === 'processed').length;
    const highRisk = claimsData.filter(c => c.estimatedDenialRisk > 0.3).length;
    const successRate = total > 0 ? Math.round((1 - claimsData.filter(c => c.estimatedDenialRisk > 0.5).length / total) * 100) : 0;
    const totalValue = claimsData.reduce((sum, claim) => sum + (claim.proposedCptCodes?.length * 150 || 0), 0); // Mock value calculation

    setStats({ total, processed, highRisk, successRate, totalValue });
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleNewClaim = (newClaim) => {
    const updatedClaims = [newClaim, ...claims];
    setClaims(updatedClaims);
    calculateStats(updatedClaims);
    setActiveView('dashboard');
  };

  const getStatusColor = (status) => {
    const colors = {
      processed: 'bg-blue-100 text-blue-700 border-blue-200',
      submitted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      denied: 'bg-red-100 text-red-700 border-red-200',
      paid: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      processed: <Clock size={14} />,
      submitted: <FileText size={14} />,
      approved: <CheckCircle size={14} />,
      denied: <AlertTriangle size={14} />,
      paid: <DollarSign size={14} />
    };
    return icons[status] || <FileText size={14} />;
  };

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Humaein AI RCM</h1>
                <p className="text-xs text-gray-500">Intelligent Revenue Cycle Management</p>
              </div>
            </div>
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <BarChart3 size={18} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveView('new-claim')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeView === 'new-claim'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <PlusCircle size={18} />
                <span>New Claim</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Revenue Dashboard</h2>
              <p className="text-gray-600">AI-powered insights for your revenue cycle</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                icon={<FileText size={20} />}
                title="Total Claims"
                value={stats.total}
                color="text-gray-900"
              />
              <StatCard
                icon={<CheckCircle size={20} />}
                title="Processed"
                value={stats.processed}
                color="text-blue-600"
                subtitle={`${stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0}% complete`}
              />
              <StatCard
                icon={<AlertTriangle size={20} />}
                title="High Risk"
                value={stats.highRisk}
                color="text-red-600"
                subtitle="Needs review"
              />
              <StatCard
                icon={<TrendingUp size={20} />}
                title="Success Rate"
                value={`${stats.successRate}%`}
                color="text-green-600"
                subtitle="Estimated approval"
              />
              <StatCard
                icon={<DollarSign size={20} />}
                title="Total Value"
                value={`$${stats.totalValue.toLocaleString()}`}
                color="text-purple-600"
                subtitle="Potential revenue"
              />
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Users size={20} />
                    <span>Recent Claims</span>
                  </h3>
                  <span className="text-sm text-gray-500">{claims.length} records</span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-pulse">
                    <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading claims...</p>
                  </div>
                </div>
              ) : claims.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No claims yet</h4>
                    <p className="text-gray-600 mb-6">Start by creating your first AI-processed claim</p>
                    <button
                      onClick={() => setActiveView('new-claim')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <PlusCircle size={18} />
                      <span>Create First Claim</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Patient', 'Insurance', 'CPT Codes', 'Risk Score', 'Status', 'Date'].map((header) => (
                          <th
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {claims.map((claim) => (
                        <tr 
                          key={claim._id} 
                          className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                          onClick={() => console.log('View claim details:', claim._id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {claim.patientName || 'Unknown Patient'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {claim.dateOfBirth ? new Date(claim.dateOfBirth).toLocaleDateString() : 'DOB not available'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-medium">{claim.insuranceCompany}</div>
                            <div className="text-sm text-gray-500">{claim.policyNumber || 'No policy number'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {claim.proposedCptCodes?.slice(0, 3).map((code, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                                >
                                  {code}
                                </span>
                              ))}
                              {claim.proposedCptCodes?.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{claim.proposedCptCodes.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              claim.estimatedDenialRisk > 0.5 
                                ? 'bg-red-100 text-red-700' 
                                : claim.estimatedDenialRisk > 0.2 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {(claim.estimatedDenialRisk * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(claim.status)}`}>
                              {getStatusIcon(claim.status)}
                              <span className="capitalize">{claim.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {new Date(claim.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(claim.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'new-claim' && (
          <ClaimForm onClaimCreated={handleNewClaim} />
        )}
      </main>
    </div>
  );
}

export default App;