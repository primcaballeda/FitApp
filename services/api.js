import { API_URL } from "../config"
import { EventEmitter } from "events";
export const eventEmitter = new EventEmitter();

// Generic fetch wrapper
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    const url = `${API_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

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

// Session check
export const checkSession = async () => {
  try {
    const response = await fetchAPI("/session-check")
    return response.authenticated
  } catch (error) {
    return false
  }
}

// Get user profile by user ID
export const getUserProfile = (userId) => {
  return fetchAPI(`/profile?user_id=${userId}`);
};

// Update user profile by user ID
export const updateUserProfile = (userId, profileData) => {
  return fetchAPI(`/profile?user_id=${userId}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
};
// Exercises
export const getExercises = () => {
  return fetchAPI("/exercises")
}

export const getPlanExercises = (planId) => {
  return fetchAPI(`/workout-plans/${planId}/exercises`)
}

// Workout plans
export const getWorkoutPlans = () => {
  return fetchAPI("/workout-plans")
}

// Get recent workouts (similar to how getWorkouts is implemented)
export const getRecentWorkouts = async () => {
  return fetchAPI("/workout-logs");
}

// Weight logging
export const logWeight = (weightData) => {
  return fetchAPI("/weight-logs", {
    method: "POST",
    body: JSON.stringify(weightData),
  })
}

export const getWeightLogs = (userId) => {
  return fetchAPI(`/weight-logs?user_id=${userId}`)
}

// Progress tracking
export const getProgress = () => {
  return fetchAPI("/progress")
}
