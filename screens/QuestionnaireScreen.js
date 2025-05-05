"use client"

import { useState, useContext, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { getUserProfile, updateUserProfile } from "../services/api"

const QuestionnaireScreen = ({ navigation, route }) => {
  const { userInfo } = useContext(AuthContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingProfile, setExistingProfile] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    height: "",
    current_weight: "",
    target_weight: "",
    fitness_level: "beginner",
  })

  // Check if we're editing an existing profile
  const isFirstTimeSetup = route.params?.isFirstTimeSetup || false

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        setLoading(true)
        const profile = await getUserProfile()

        if (profile) {
          setExistingProfile(profile)
          setFormData({
            name: profile.name || "",
            age: profile.age ? profile.age.toString() : "",
            gender: profile.gender || "Male",
            height: profile.height ? profile.height.toString() : "",
            current_weight: profile.current_weight ? profile.current_weight.toString() : "",
            target_weight: profile.target_weight ? profile.target_weight.toString() : "",
            fitness_level: profile.fitness_level || "beginner",
          })
        }
      } catch (error) {
        console.log("Error fetching profile:", error)
        // If it's first time setup, we expect no profile to exist
        if (!isFirstTimeSetup) {
          Alert.alert("Error", "Failed to fetch your profile data")
        }
      } finally {
        setLoading(false)
      }
    }

    checkExistingProfile()
  }, [isFirstTimeSetup])

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Name
        if (!formData.name.trim()) {
          Alert.alert("Error", "Please enter your name")
          return false
        }
        return true
      case 2: // Age
        if (!formData.age || isNaN(Number.parseInt(formData.age))) {
          Alert.alert("Error", "Please enter a valid age")
          return false
        }
        return true
      case 3: // Gender
        return true // Gender always has a default value
      case 4: // Height
        if (!formData.height || isNaN(Number.parseFloat(formData.height))) {
          Alert.alert("Error", "Please enter a valid height in cm")
          return false
        }
        return true
      case 5: // Current weight
        if (!formData.current_weight || isNaN(Number.parseFloat(formData.current_weight))) {
          Alert.alert("Error", "Please enter a valid current weight in kg")
          return false
        }
        return true
      case 6: // Target weight
        if (!formData.target_weight || isNaN(Number.parseFloat(formData.target_weight))) {
          Alert.alert("Error", "Please enter a valid target weight in kg")
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 7) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      // Convert string values to numbers
      const profileData = {
        name: formData.name,
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        height: Number.parseFloat(formData.height),
        current_weight: Number.parseFloat(formData.current_weight),
        target_weight: Number.parseFloat(formData.target_weight),
        fitness_level: formData.fitness_level,
      }

      await updateUserProfile(profileData)

      Alert.alert("Success", isFirstTimeSetup ? "Profile created successfully!" : "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            if (isFirstTimeSetup) {
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              })
            } else {
              navigation.goBack()
            }
          },
        },
      ])
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6, 7].map((step) => (
          <View key={step} style={[styles.progressStep, currentStep >= step ? styles.progressStepActive : {}]} />
        ))}
      </View>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepDescription}>We'll use this to personalize your experience</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>
        )
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How old are you?</Text>
            <Text style={styles.stepDescription}>Your age helps us tailor workouts to your needs</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => handleChange("age", text)}
              placeholder="Enter your age"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>
        )
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your gender?</Text>
            <Text style={styles.stepDescription}>This helps us calculate your fitness metrics more accurately</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
                style={styles.picker}
              >
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>
        )
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your height?</Text>
            <Text style={styles.stepDescription}>Enter your height in centimeters</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(text) => handleChange("height", text)}
              placeholder="Height in cm (e.g., 175)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        )
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your current weight?</Text>
            <Text style={styles.stepDescription}>Enter your current weight in kilograms</Text>
            <TextInput
              style={styles.input}
              value={formData.current_weight}
              onChangeText={(text) => handleChange("current_weight", text)}
              placeholder="Weight in kg (e.g., 70.5)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        )
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your target weight?</Text>
            <Text style={styles.stepDescription}>Enter your goal weight in kilograms</Text>
            <TextInput
              style={styles.input}
              value={formData.target_weight}
              onChangeText={(text) => handleChange("target_weight", text)}
              placeholder="Target weight in kg"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        )
      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your fitness level?</Text>
            <Text style={styles.stepDescription}>This helps us recommend appropriate workouts</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.fitness_level}
                onValueChange={(value) => handleChange("fitness_level", value)}
                style={styles.picker}
              >
                <Picker.Item label="Beginner" value="beginner" />
                <Picker.Item label="Intermediate" value="intermediate" />
                <Picker.Item label="Advanced" value="advanced" />
              </Picker>
            </View>
          </View>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E54D2E" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isFirstTimeSetup ? "Complete Your Profile" : "Update Your Profile"}</Text>
          <Text style={styles.headerSubtitle}>Step {currentStep} of 7</Text>
          {renderProgressBar()}
        </View>

        {renderStepContent()}

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color="#E54D2E" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={nextStep} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFEE9C" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{currentStep === 7 ? "Submit" : "Next"}</Text>
                {currentStep < 7 && <Ionicons name="arrow-forward" size={20} color="#FFEE9C" />}
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#E54D2E",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFEE9C",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFEE9C",
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 238, 156, 0.3)",
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: "#FFEE9C",
  },
  stepContainer: {
    padding: 20,
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    marginTop: "auto",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  backButtonText: {
    color: "#E54D2E",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  nextButton: {
    backgroundColor: "#E54D2E",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 10,
  },
  nextButtonText: {
    color: "#FFEE9C",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
})

export default QuestionnaireScreen
