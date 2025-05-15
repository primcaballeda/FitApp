import { API_URL } from "../config";
import { EventEmitter } from "events";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const eventEmitter = new EventEmitter();

// Helper function to get the token
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Generic fetch function with auth
export const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    // Add token to headers if available
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: "include", // Important for cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Non-JSON response:", await response.text());
      throw new Error("Invalid response format");
    }

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error(`API error on ${endpoint}:`, error);
    throw error;
  }
};

// Session check
export const checkSession = async () => {
  try {
    const response = await fetchWithAuth("/session-check");
    return response.authenticated;
  } catch (error) {
    return false;
  }
};

// Get user profile by user ID
export const getUserProfile = (userId) => {
  if (!userId) {
    console.error("getUserProfile called without a user ID");
    return Promise.reject(new Error("User ID is required"));
  }
  return fetchWithAuth(`/profile?user_id=${userId}`).then((response) => {
    console.log("Profile API response:", response);
    // Make sure numeric fields are properly parsed as numbers
    if (response) {
      return {
        ...response,
        age: response.age ? Number(response.age) : null,
        height: response.height ? Number(response.height) : null,
        current_weight: response.current_weight
          ? Number(response.current_weight)
          : null,
        target_weight: response.target_weight
          ? Number(response.target_weight)
          : null,
      };
    }
    return response;
  });
};

// Update user profile by user ID
export const updateUserProfile = (userId, profileData) => {
  if (!userId) {
    console.error("updateUserProfile called without a user ID");
    return Promise.reject(new Error("User ID is required"));
  }
  console.log(`Updating profile for user ID: ${userId}`, profileData);
  return fetchWithAuth(`/profile?user_id=${userId}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
};
// Exercises
export const getExercises = () => {
  return fetchWithAuth("/exercises");
};

export const getPlanExercises = (planId) => {
  return fetchWithAuth(`/workout-plans/${planId}/exercises`);
};

// Workout plans
export const getWorkoutPlans = () => {
  return fetchWithAuth("/workout-plans");
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
};

// Weight logging
export const logWeight = async (weightData) => {
  try {
    console.log("Logging weight data:", weightData);
    
    // Make sure user_id exists in the payload
    if (!weightData.user_id) {
      console.error("Missing user_id in weight logging data");
      // Try to get user_id from AsyncStorage if missing
      const userInfoStr = await AsyncStorage.getItem("userInfo");
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        weightData.user_id = userInfo.id;
      }
    }
    
    // Now proceed with the API call
    return await fetchWithAuth("/weight-logs", {
      method: "POST",
      body: JSON.stringify(weightData),
    });
  } catch (error) {
    console.error("Error in logWeight:", error);
    // Don't throw here, just log the error and return null
    // This prevents the error from disrupting the profile update flow
    return null;
  }
};

export const getWeightLogs = () => {
  return fetchWithAuth("/weight-logs");
};

// Progress tracking
export const getProgress = () => {
  return fetchWithAuth("/progress");
};

// Log workout sessions with proper day_number field
export const logWorkoutSession = async (workoutData) => {
  try {
    console.log("Sending workout data:", JSON.stringify(workoutData));
    // Ensure each workout entry has day_number properly set
    
    return await fetchAPI("/workout-sessions", {
      method: "POST",
      body: JSON.stringify(workoutData),
    });
  } catch (error) {
    console.error("Error logging workout session:", error);
    throw error;
  } finally {
    // Emit event to refresh workouts list
    eventEmitter.emit("workoutAdded");
  }
};

// Add or update this function
export const getRecentWorkouts = () => {
  return fetchAPI('/workout-sessions');
};

export const saveQuestionnaireAnswers = (answers) => {
  return fetchAPI('/questionnaire', {
    method: 'POST',
    body: JSON.stringify(answers),
  });
};
