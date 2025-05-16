import React, { useContext } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { AuthProvider, AuthContext } from "./context/AuthContext"
import { eventEmitter } from "./services/EventEmitter"
import { useEffect, useRef } from "react"
import { Alert, ActivityIndicator } from "react-native"

// Screens
import LoginScreen from "./screens/LoginScreen"
import RegisterScreen from "./screens/RegisterScreen"
import HomeScreen from "./screens/HomeScreen"
import WorkoutPlansScreen from "./screens/WorkoutPlansScreen"
import WorkoutDetailScreen from "./screens/WorkoutDetailScreen"
import ProfileScreen from "./screens/ProfileScreen"
import ProgressScreen from "./screens/ProgressScreen"
import LogWeightScreen from "./screens/LogWeightScreen"
import LogWorkoutScreen from "./screens/LogWorkoutScreen"
import QuestionnaireScreen from "./screens/QuestionnaireScreen"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Workouts") {
            iconName = focused ? "fitness" : "fitness-outline"
          } else if (route.name === "Progress") {
            iconName = focused ? "stats-chart" : "stats-chart-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#E54D2E",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workouts" component={WorkoutStackNavigator} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const WorkoutStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#E54D2E",
        },
        headerTintColor: "#FFEE9C",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen name="Workout Plans" component={WorkoutPlansScreen} />
      <Stack.Screen name="Workout Detail" component={WorkoutDetailScreen} />
      <Stack.Screen name="Log Workout" component={LogWorkoutScreen} />
    </Stack.Navigator>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="LogWeight" component={LogWeightScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}

export default App
