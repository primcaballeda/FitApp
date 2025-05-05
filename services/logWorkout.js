import { API_URL } from "../config"
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
// log a batch of workout payload
export const logWorkoutSession = async (payload) => {
  return fetchAPI(`/workout-sessions`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Get workout logs
export const getWorkouts = () => {
    return fetchAPI("/workout-logs")
  }