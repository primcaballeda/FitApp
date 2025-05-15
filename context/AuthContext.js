"use client"

import React, { createContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config"
import { Alert } from "react-native"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)
  const [userToken, setUserToken] = useState(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(true)

  const register = async (userData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      // Set as new user before setting userInfo
      setIsNewUser(true)
      setUserInfo(data)
      await AsyncStorage.setItem("userInfo", JSON.stringify(data))
      
      setIsLoading(false)
      return data

    } catch (error) {
      setIsLoading(false)
      console.log("Registration error:", error)
      throw error
    }
  }

  // Function to check if profile is complete
  const checkProfileCompleteness = async (token) => {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        // Check if any of these fields are null, undefined, or empty string
        const isComplete = 
          data.age != null && 
          data.height != null && 
          data.current_weight != null && 
          data.target_weight != null

        setIsProfileComplete(isComplete)
        return isComplete
      } else {
        console.log("Error fetching profile:", data.message)
        return false
      }
    } catch (error) {
      console.log("Profile check error:", error)
      return false
    }
  }

  // Add the completeQuestionnaire function that was missing
  const completeQuestionnaire = async () => {
    try {
      // Update the isProfileComplete state
      setIsProfileComplete(true)
      
      // We can also store this information locally if needed
      await AsyncStorage.setItem("profileComplete", "true")
      
      return true
    } catch (error) {
      console.log("Error completing questionnaire:", error)
      return false
    }
  }

  const login = async (username, password) => {
    try {
      setIsLoading(true)

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store both user info and token
        const info = {
          id: data.user_id,
          username: data.username,
        }
        setUserInfo(info)
        setUserToken(data.token)

        // Save both to AsyncStorage
        await AsyncStorage.setItem("userInfo", JSON.stringify(info))
        await AsyncStorage.setItem("userToken", data.token)
        
        // Check if profile is complete
        const profileComplete = await checkProfileCompleteness(data.token)
        
        return {
          success: true,
          profileComplete: profileComplete
        }
      } else {
        throw new Error(data.message || "Login failed")
      }
    } catch (error) {
      console.log("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)

      // Also call logout endpoint to clear server-side session
      if (userToken) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        })
      }

      // Clear local state
      setUserInfo(null)
      setUserToken(null)

      // Clear storage
      await AsyncStorage.removeItem("userInfo")
      await AsyncStorage.removeItem("userToken")
    } catch (error) {
      console.log("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isLoggedIn = async () => {
    try {
      setIsLoading(true)

      // Load both user info and token
      const storedUserInfo = await AsyncStorage.getItem("userInfo")
      const storedUserToken = await AsyncStorage.getItem("userToken")

      if (storedUserInfo && storedUserToken) {
        setUserInfo(JSON.parse(storedUserInfo))
        setUserToken(storedUserToken)
      }
    } catch (error) {
      console.log("isLoggedIn error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    isLoggedIn()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        register,
        login,
        logout,
        isLoading,
        userInfo,
        userToken,
        isNewUser,
        setIsNewUser,
        isProfileComplete,
        checkProfileCompleteness,
        completeQuestionnaire, // Add the new function to the context
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}