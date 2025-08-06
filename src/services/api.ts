// src/services/api.ts

import axios from 'axios';

// Define the structure of user risk data
export interface UserRiskData {
  user_id: string;
  name: string;
  email: string;
  current_score: number;
  risk_level: string;
  last_updated: string; // ISO date string
}

// Create a reusable Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // Change if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define API methods
export const riskAPI = {
  // GET: Fetch all users' risk scores
  getUserRiskScores: async (): Promise<UserRiskData[]> => {
    const response = await axiosInstance.get<UserRiskData[]>('/users/risk-scores');
    return response.data;
  },

  // GET: Fetch a single user by ID (optional)
  getUserById: async (userId: string): Promise<UserRiskData> => {
    const response = await axiosInstance.get<UserRiskData>(`/users/${userId}`);
    return response.data;
  },

  // POST or PUT: Update risk score (example, optional)
  updateRiskScore: async (
    userId: string,
    newScore: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.put(`/users/${userId}/update-score`, {
      score: newScore,
    });
    return response.data;
  },
};
