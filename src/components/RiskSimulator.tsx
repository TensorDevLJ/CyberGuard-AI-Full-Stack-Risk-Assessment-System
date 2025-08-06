import React, { useState } from 'react';
import { Play, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { riskAPI, PredictionRequest } from '../services/api';
import toast from 'react-hot-toast';

const RiskSimulator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState<PredictionRequest>({
    user_id: 1,
    action: 'login',
    resource: '/admin/dashboard',
    location: '192.168.1.100',
    success: true,
    login_frequency: 1,
    failed_attempts: 0,
    file_size: 0,
    session_duration: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await riskAPI.predict(formData);
      setResult(response.data);
      toast.success('Risk assessment completed!');
    } catch (error) {
      toast.error('Failed to assess risk');
      console.error('Risk prediction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PredictionRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getRiskColor = (score: number) => {
    if (score >= 40) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 30) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 20) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const presetScenarios = [
    {
      name: 'Normal Activity',
      data: {
        action: 'file_access',
        resource: '/documents/report.pdf',
        location: '192.168.1.100',
        success: true,
        failed_attempts: 0,
        session_duration: 120,
      }
    },
    {
      name: 'Suspicious Late Access',
      data: {
        action: 'system_access',
        resource: '/admin/config.php',
        location: '203.0.113.42',
        success: true,
        failed_attempts: 0,
        session_duration: 15,
      }
    },
    {
      name: 'Failed Login Attempts',
      data: {
        action: 'login',
        resource: '/login',
        location: '198.51.100.30',
        success: false,
        failed_attempts: 5,
        session_duration: 5,
      }
    },
    {
      name: 'Large Data Download',
      data: {
        action: 'download',
        resource: '/database/backup.sql',
        location: '10.0.0.50',
        success: true,
        failed_attempts: 0,
        file_size: 2048,
        session_duration: 300,
      }
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Risk Assessment Simulator
        </h3>
        <div className="flex space-x-2">
          {presetScenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => setFormData(prev => ({ ...prev, ...scenario.data }))}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <input
                  type="number"
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => handleInputChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="login">Login</option>
                  <option value="file_access">File Access</option>
                  <option value="download">Download</option>
                  <option value="upload">Upload</option>
                  <option value="system_access">System Access</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resource
              </label>
              <input
                type="text"
                value={formData.resource || ''}
                onChange={(e) => handleInputChange('resource', e.target.value)}
                placeholder="/path/to/resource"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location (IP)
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Failed Attempts
                </label>
                <input
                  type="number"
                  value={formData.failed_attempts || 0}
                  onChange={(e) => handleInputChange('failed_attempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Size (MB)
                </label>
                <input
                  type="number"
                  value={formData.file_size || 0}
                  onChange={(e) => handleInputChange('file_size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Duration (min)
                </label>
                <input
                  type="number"
                  value={formData.session_duration || 60}
                  onChange={(e) => handleInputChange('session_duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="success"
                checked={formData.success}
                onChange={(e) => handleInputChange('success', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="success" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Action Successful
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Assess Risk
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {result ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${getRiskColor(result.risk_score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Risk Assessment Result</h4>
                  <div className="flex items-center">
                    {result.risk_score >= 30 ? (
                      <AlertTriangle className="h-5 w-5 mr-1" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-1" />
                    )}
                    <span className="text-2xl font-bold">{result.risk_score}</span>
                  </div>
                </div>
                <p className="text-sm opacity-90">{result.explanation}</p>
                <div className="mt-2 flex items-center text-xs opacity-75">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Recommended Actions:
                  </h5>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-blue-800 dark:text-blue-400 flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Run a risk assessment to see results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskSimulator;