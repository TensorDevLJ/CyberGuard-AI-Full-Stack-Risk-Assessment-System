import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, User, Mail, TrendingUp, RefreshCw } from 'lucide-react';
import { riskAPI } from './api';
import toast from 'react-hot-toast';

interface Recommendation {
  user_id: number;
  user_name: string;
  user_email: string;
  risk_score: number;
  risk_level: string;
  recommendations: string[];
  recent_activity_count: number;
  last_updated: string;
}

interface RecommendationsData {
  total_high_risk_users: number;
  recommendations: Recommendation[];
  generated_at: string;
}

const Recommendations: React.FC = () => {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const recommendationsData = await response.json();
        setData(recommendationsData);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRecommendations();
    toast.success('Recommendations updated');
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getPriorityIcon = (riskScore: number) => {
    if (riskScore >= 40) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    return <TrendingUp className="h-5 w-5 text-orange-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Recommendations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered security recommendations based on risk analysis
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">High Risk Users</p>
                <p className="text-2xl font-bold text-red-600">{data.total_high_risk_users}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Recommendations</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.recommendations.reduce((sum, rec) => sum + rec.recommendations.length, 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(data.generated_at).toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      {data && data.recommendations.length > 0 ? (
        <div className="space-y-4">
          {data.recommendations.map((recommendation) => (
            <div
              key={recommendation.user_id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {recommendation.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      {getPriorityIcon(recommendation.risk_score)}
                      <span className="ml-2">{recommendation.user_name}</span>
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {recommendation.user_email}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {recommendation.recent_activity_count} recent activities
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-red-600">
                      {recommendation.risk_score.toFixed(1)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(recommendation.risk_level)}`}>
                      {recommendation.risk_level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Updated: {new Date(recommendation.last_updated).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Recommended Actions:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recommendation.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            All Clear!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No high-risk users detected. Your security posture looks good.
          </p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;