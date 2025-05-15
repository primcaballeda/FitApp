import { API_URL } from "../config"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { eventEmitter } from './EventEmitter';

// Fix the token retrieval to be consistent
const getAuthToken = async () => {
  try {
    // Use a single token name across the app
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }
    
    // Use the getAuthToken function for consistency
    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}${endpoint}`
    console.log(`Workout API Request to ${url}`, { method: options.method || 'GET' });

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    })

    // Try to parse the response as JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.log("Non-JSON response:", await response.text());
      throw new Error("Invalid response format");
    }

    if (!response.ok) {
      console.error("API Error:", data)
      throw new Error(data.message || "Something went wrong")
    }

    return data 
  } catch (error) {
    console.error(`API error on ${endpoint}:`, error)
    throw error
  }
}

// log a batch of workout payload - FIXED version
export const logWorkoutSession = async (workoutData) => {
  try {
    // Add debug logging to verify day_number is included
    const firstEntry = workoutData[0] || {};
    console.log("Day number in payload:", firstEntry.day_number);
    
    // Use fetchAPI instead of direct fetch for consistency
    return await fetchAPI('/workout-sessions', {
      method: 'POST',
      body: JSON.stringify(workoutData)
    });
  } catch (error) {
    console.error('Error in logWorkoutSession:', error);
    throw error;
  } finally {
    // Always emit the event regardless of success/failure
    eventEmitter.emit("workoutAdded");
  }
};

// Get workout logs
export const getWorkouts = async () => {
  try {
    const data = await fetchAPI("/workout-sessions");
    console.log("Received workouts data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return []; // Return empty array on error
  }
}