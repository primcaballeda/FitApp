import { API_URL } from '../config';

export const fetchAPI = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies (session) with the request
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// User profile
export const getUserProfile = () => {
  return fetchAPI('/profile');
};

export const updateUserProfile = (profileData) => {
  return fetchAPI('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};


export const getPlanExercises = (planId) => {
  return fetchAPI(`/workout-plans/${planId}/exercises`);
};

// Fetch exercises
export const getExercises = () => {
    return fetchAPI('/exercises');
  };
  
  // Fetch workout plans
  export const getWorkoutPlans = () => {
    return fetchAPI('/workout-plans');
  };
  
  // Fetch user profiles
  export const getUserProfiles = () => {
    return fetchAPI('/user-profiles');
  };

// Workout logging
export const logWorkout = (workoutData) => {
  return fetchAPI('/workouts', {
    method: 'POST',
    body: JSON.stringify(workoutData),
  });
};

export const getWorkouts = () => {
  return fetchAPI('/workouts');
};

// Weight logging
export const logWeight = (weightData) => {
  return fetchAPI('/weight', {
    method: 'POST',
    body: JSON.stringify(weightData),
  });
};

export const getWeightLogs = () => {
  return fetchAPI('/weight');
};

// Progress
export const getProgress = () => {
  return fetchAPI('/progress');
};
