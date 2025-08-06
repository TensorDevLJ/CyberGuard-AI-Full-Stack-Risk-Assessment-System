import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, AlertTriangle, Clock, MapPin, FileText, TrendingUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { riskAPI } from "../services/api";



const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  const fetchUserData = async () => {
    try {
      const [activitiesResponse, usersResponse] = await Promise.all([
        riskAPI.getUserActivity(parseInt(id!)),
        riskAPI.getUserRiskScores(),
      ]);

      const userData = usersResponse.data.find((u: any) => u.user_id === parseInt(id!));
      
      setActivities(activitiesResponse.data);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 40) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (score >= 30) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    if (score >= 20) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <Activity className="h-4 w-4" />;
      case 'file_access':
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Generate chart data from activities
  const chartData = {
    labels: activities.slice(-20).map(activity => 
      new Date(activity.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Risk Score',
        data: activities.slice(-20).map(activity => activity.risk_score),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#6b7280',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
        },
        beginAtZero: true,
        max: 50,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">User not found</p>
        <Link
          to="/users"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/users"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getRiskScoreColor(user.current_score)}`}>
            Risk Score: {user.current_score.toFixed(1)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Level: {user.risk_level}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Risk Events</p>
              <p className="text-2xl font-bold text-red-600">
                {activities.filter(a => a.risk_score >= 30).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Risk Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activities.length > 0 ? 
                  (activities.reduce((sum, a) => sum + a.risk_score, 0) / activities.length).toFixed(1) : 
                  '0.0'
                }
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Activity</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activities.length > 0 ? 
                  new Date(activities[0].timestamp).toLocaleDateString() : 
                  'No activity'
                }
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Risk Score Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Score Trend</h3>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
        </div>
        
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No activities recorded for this user.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getRiskScoreColor(activity.risk_score)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.action.replace('_', ' ').toUpperCase()}
                      </h4>
                      {activity.resource && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <FileText className="inline h-3 w-3 mr-1" />
                          {activity.resource}
                        </p>
                      )}
                      {activity.location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {activity.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskScoreColor(activity.risk_score)}`}>
                      {activity.risk_score.toFixed(1)}
                    </span>
                    <p className={`text-xs mt-1 ${activity.success ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.success ? 'Success' : 'Failed'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;