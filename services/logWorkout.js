import { API_URL } from "../config"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { eventEmitter } from './EventEmitter';

const getAuthToken = async () => {
  try {
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

export const logWorkoutSession = async (workoutData) => {
  try {
    const firstEntry = workoutData[0] || {};
    console.log("Day number in payload:", firstEntry.day_number);
    
    return await fetchAPI('/workout-sessions', {
      method: 'POST',
      body: JSON.stringify(workoutData)
    });
  } catch (error) {
    console.error('Error in logWorkoutSession:', error);
    throw error;
  } finally {
    eventEmitter.emit("workoutAdded");
  }
};
export const getWorkouts = async () => {
  try {
    const data = await fetchAPI("/workout-sessions");
    console.log("Received workouts data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return []; 
  }
}