"use client"

import { createContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config.js"
import { checkSession } from "../services/api.js"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)

  const login = async (username, password) => {
    try {
      setIsLoading(true)

      console.log("Attempting login for:", username)
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important for session cookies
      })

      const data = await response.json()
      console.log("Login response status:", response.status)
      console.log("Login response data:", data)

      if (response.ok) {
        const info = {
          id: data.user_id,
          username: data.username,
        }
        console.log("Login successful, user info:", info)
        setUserInfo(info)
        await AsyncStorage.setItem("userInfo", JSON.stringify(info))

        // Store login timestamp
        await AsyncStorage.setItem("loginTimestamp", Date.now().toString())

        return info
      } else {
        console.log("Login failed:", data.message)
        throw new Error(data.message || "Login failed")
      }
    } catch (error) {
      console.log("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setIsLoading(true)

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      console.log("Register response:", data)

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      return data
    } catch (error) {
      console.log("Registration error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)

      // Call the logout endpoint
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      })

      setUserInfo(null)
      await AsyncStorage.removeItem("userInfo")
      await AsyncStorage.removeItem("loginTimestamp")

      console.log("User logged out successfully")
    } catch (error) {
      console.log("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if the session is still valid
  const validateSession = async () => {
    try {
      const isValid = await checkSession()

      if (!isValid) {
        console.log("Session invalid, clearing user info")
        setUserInfo(null)
        await AsyncStorage.removeItem("userInfo")
        return false
      }

      return true
    } catch (error) {
      console.log("Session validation error:", error)
      return false
    }
  }

  // Get the current user ID
  const getUserId = () => {
    return userInfo?.id || null
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true)
        const storedUserInfo = await AsyncStorage.getItem("userInfo")

        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo)
          console.log("Found stored user info:", parsedUserInfo)

          // Check if the session is still valid
          const sessionValid = await validateSession()

          if (sessionValid) {
            console.log("Session is valid, setting user info")
            setUserInfo(parsedUserInfo)
          } else {
            console.log("Session expired, clearing user info")
            await AsyncStorage.removeItem("userInfo")
          }
        } else {
          console.log("No stored user info found")
        }
      } catch (error) {
        console.log("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        validateSession,
        getUserId,
        isLoading,
        userInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
