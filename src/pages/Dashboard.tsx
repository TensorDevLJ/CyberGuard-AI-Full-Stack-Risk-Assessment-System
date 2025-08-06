import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Shield,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import RiskSimulator from '../components/RiskSimulator';
import { riskAPI } from "../services/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface DashboardStats {
  total_users: number;
  high_risk_users: number;
  recent_alerts: number;
  average_risk_score: number;
}

interface RiskTrend {
  date: string;
  average_score: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    high_risk_users: 0,
    recent_alerts: 0,
    average_risk_score: 0,
  });
  const [trends, setTrends] = useState<RiskTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, trendsResponse] = await Promise.all([
        riskAPI.getDashboardStats(),
        riskAPI.getRiskTrends(),
      ]);

      setStats(statsResponse.data);
      setTrends(trendsResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
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
      },
    },
  };

  const lineChartData = {
    labels: trends.map(trend => new Date(trend.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Average Risk Score',
        data: trends.map(trend => trend.average_score),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const riskDistributionData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
    datasets: [
      {
        data: [45, 30, 20, 5], // Sample data
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#7c2d12',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users.toLocaleString(),
      icon: Users,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'High Risk Users',
      value: stats.high_risk_users.toLocaleString(),
      icon: AlertTriangle,
      color: 'red',
      change: '-8%',
    },
    {
      title: 'Recent Alerts',
      value: stats.recent_alerts.toLocaleString(),
      icon: AlertCircle,
      color: 'orange',
      change: '+24%',
    },
    {
      title: 'Avg Risk Score',
      value: stats.average_risk_score.toFixed(1),
      icon: TrendingUp,
      color: 'green',
      change: '-5%',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and analyze cybersecurity risks in real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${
                    card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change} from last week
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getColorClasses(card.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Trends</h3>
          <div className="h-80">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut 
              data={riskDistributionData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#6b7280',
                      padding: 20,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Risk Simulator */}
      <RiskSimulator />

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Security Events</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[
            {
              user: 'Alice Johnson',
              action: 'Failed login attempt',
              risk: 'High',
              time: '5 minutes ago',
              status: 'alert',
            },
            {
              user: 'Bob Wilson',
              action: 'Large file download',
              risk: 'Medium',
              time: '12 minutes ago',
              status: 'warning',
            },
            {
              user: 'Charlie Brown',
              action: 'Normal system access',
              risk: 'Low',
              time: '18 minutes ago',
              status: 'success',
            },
            {
              user: 'Diana Smith',
              action: 'Off-hours access',
              risk: 'High',
              time: '25 minutes ago',
              status: 'alert',
            },
          ].map((event, index) => (
            <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${
                  event.status === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                  event.status === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                  'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {event.status === 'alert' ? <AlertCircle className="h-4 w-4" /> :
                   event.status === 'warning' ? <Activity className="h-4 w-4" /> :
                   <CheckCircle className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{event.user}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.action}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  event.risk === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  event.risk === 'Medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {event.risk}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;