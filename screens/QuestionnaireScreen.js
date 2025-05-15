"use client"

import { useState, useContext, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"
import { getUserProfile, updateUserProfile, logWeight } from "../services/api"

const QuestionnaireScreen = ({ navigation, route }) => {
  const { userInfo, completeQuestionnaire } = useContext(AuthContext)
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
  
  // Added state variables for custom alert modal
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertCallback, setAlertCallback] = useState(null)

  // Add these with your other state variables
  const [genderDropdownVisible, setGenderDropdownVisible] = useState(false);
  const [fitnessDropdownVisible, setFitnessDropdownVisible] = useState(false);

  // Check if we're editing an existing profile
  const isFirstTimeSetup = route?.params?.isFirstTimeSetup || false

  // Custom alert function using Modal component
  const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    
    // Store callback for OK button if provided
    if (buttons && buttons.length > 0 && buttons[0].onPress) {
      setAlertCallback(() => buttons[0].onPress);
    } else {
      setAlertCallback(null);
    }
    
    setAlertVisible(true);
  };
  
  // Handle alert dismiss with possible callback
  const handleAlertDismiss = () => {
    setAlertVisible(false);
    
    // If we have a callback, execute it
    if (alertCallback) {
      alertCallback();
      setAlertCallback(null); // Clear the callback
    }
  };

  // Navigation helper function that works in both React Native and web
  const navigateTo = (screenName, resetNavigation = false) => {
    if (navigation && typeof navigation.navigate === 'function' && !resetNavigation) {
      navigation.navigate(screenName);
    } else if (navigation && typeof navigation.reset === 'function' && resetNavigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: screenName }],
      });
    } else if (typeof window !== 'undefined') {
      // For web, redirect to the appropriate route
      window.location.href = `/${screenName.toLowerCase()}`;
    }
  };

  // Navigation go back helper function
  const goBack = () => {
    if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    } else if (typeof window !== 'undefined') {
      // For web, use browser's back functionality
      window.history.back();
    }
  };

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        setLoading(true)
        // Pass the user ID to getUserProfile
        const profile = await getUserProfile(userInfo?.id)

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
          showAlert("Error", "Failed to fetch your profile data")
        }
      } finally {
        setLoading(false)
      }
    }

    checkExistingProfile()
  }, [isFirstTimeSetup, userInfo?.id])

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Age first in this file
        if (!formData.age || isNaN(Number.parseInt(formData.age))) {
          showAlert("Error", "Please enter a valid age")
          return false
        }
        return true
      case 2: // Gender
        return true // Gender always has a default value
      case 3: // Height
        if (!formData.height || isNaN(Number.parseFloat(formData.height))) {
          showAlert("Error", "Please enter a valid height in cm")
          return false
        }
        return true
      case 4: // Current weight
        if (!formData.current_weight || isNaN(Number.parseFloat(formData.current_weight))) {
          showAlert("Error", "Please enter a valid current weight in kg")
          return false
        }
        return true
      case 5: // Target weight
        if (!formData.target_weight || isNaN(Number.parseFloat(formData.target_weight))) {
          showAlert("Error", "Please enter a valid target weight in kg")
          return false
        }
        return true
      case 6: // Fitness level
        return true // Fitness level always has a default value
      case 7: // Name
        if (!formData.name.trim()) {
          showAlert("Error", "Please enter your name")
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
      setSaving(true);

      // Convert string values to numbers
      const profileData = {
        name: formData.name,
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        height: Number.parseFloat(formData.height),
        current_weight: Number.parseFloat(formData.current_weight),
        target_weight: Number.parseFloat(formData.target_weight),
        fitness_level: formData.fitness_level,
      };

      // First update the profile
      console.log("Updating profile with data:", profileData);
      await updateUserProfile(userInfo?.id, profileData);
      
      // Log weight separately and handle potential errors
      try {
        const currentDate = new Date().toISOString().split('T')[0];
        const weightLogData = {
          user_id: userInfo?.id,
          weight: Number.parseFloat(formData.current_weight),
          log_date: currentDate,
          notes: isFirstTimeSetup ? "Initial weight from profile setup" : "Weight updated from profile"
        };
        
        console.log("Logging weight with data:", weightLogData);
        await logWeight(weightLogData);
        console.log("Weight logged successfully");
      } catch (weightLogError) {
        // Just log the error but continue with flow
        console.error("Error logging weight:", weightLogError);
      }

      // Now proceed with the questionnaire completion
      await handleSubmitQuestionnaire(formData);
    } catch (error) {
      console.error("Profile update error:", error);
      showAlert("Error", error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Fix the handleSubmitQuestionnaire function
  const handleSubmitQuestionnaire = async (formData) => {
    try {
      // Mark the questionnaire as completed using the context function
      await completeQuestionnaire();
      
      // Show success message
      showAlert("Success", "Your profile has been updated successfully!", () => {
        // Navigate to Main screen (which contains HomeScreen as a tab)
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }], // Change 'Home' to 'Main'
        });
      });
    } catch (error) {
      console.error("Error completing questionnaire:", error);
      showAlert("Error", "Failed to complete profile setup. Please try again.");
    }
  };

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
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your gender?</Text>
            <Text style={styles.stepDescription}>This helps us calculate your fitness metrics more accurately</Text>
            
            <TouchableOpacity 
              style={styles.customDropdown}
              onPress={() => setGenderDropdownVisible(true)}
            >
              <Text style={styles.dropdownText}>{formData.gender}</Text>
              <Ionicons name="chevron-down" size={20} style={styles.dropdownIcon} />
            </TouchableOpacity>
            
            {/* Gender Dropdown Modal */}
            <Modal
              transparent={true}
              visible={genderDropdownVisible}
              animationType="fade"
              onRequestClose={() => setGenderDropdownVisible(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setGenderDropdownVisible(false)}
              >
                <View style={styles.dropdownModal}>
                  {['Male', 'Female', 'Other'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownOption,
                        formData.gender === option && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        handleChange('gender', option);
                        setGenderDropdownVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        formData.gender === option && styles.dropdownOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                      {formData.gender === option && (
                        <Ionicons name="checkmark" size={20} color="#E54D2E" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )
      case 3:
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
      case 4:
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
      case 5:
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
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your fitness level?</Text>
            <Text style={styles.stepDescription}>This helps us recommend appropriate workouts</Text>
            
            <TouchableOpacity 
              style={styles.customDropdown}
              onPress={() => setFitnessDropdownVisible(true)}
            >
              <View style={styles.dropdownContent}>
                <Ionicons 
                  name={
                    formData.fitness_level === 'beginner' ? 'walk-outline' : 
                    formData.fitness_level === 'intermediate' ? 'bicycle-outline' : 'fitness-outline'
                  } 
                  size={20} 
                  color="#888"
                  style={styles.dropdownContentIcon}
                />
                <Text style={styles.dropdownText}>
                  {formData.fitness_level.charAt(0).toUpperCase() + formData.fitness_level.slice(1)}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} style={styles.dropdownIcon} />
            </TouchableOpacity>
            
            {/* Fitness Level Dropdown Modal */}
            <Modal
              transparent={true}
              visible={fitnessDropdownVisible}
              animationType="fade"
              onRequestClose={() => setFitnessDropdownVisible(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setFitnessDropdownVisible(false)}
              >
                <View style={styles.dropdownModal}>
                  {[
                    { label: 'Beginner', value: 'beginner', icon: 'walk-outline' },
                    { label: 'Intermediate', value: 'intermediate', icon: 'bicycle-outline' },
                    { label: 'Advanced', value: 'advanced', icon: 'fitness-outline' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        formData.fitness_level === option.value && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        handleChange('fitness_level', option.value);
                        setFitnessDropdownVisible(false);
                      }}
                    >
                      <View style={styles.dropdownOptionContent}>
                        <Ionicons name={option.icon} size={20} color={formData.fitness_level === option.value ? "#E54D2E" : "#888"} />
                        <Text style={[
                          styles.dropdownOptionText,
                          formData.fitness_level === option.value && styles.dropdownOptionTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                      {formData.fitness_level === option.value && (
                        <Ionicons name="checkmark" size={20} color="#E54D2E" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )
      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepDescription}>Please confirm your name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Your full name"
              placeholderTextColor="#999"
            />
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
      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={() => handleAlertDismiss()}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{alertTitle}</Text>
            <Text style={styles.modalText}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleAlertDismiss()}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
  // Added styles for modal alert
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#E54D2E",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#E54D2E",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
  },
  modalButtonText: {
    color: "#FFEE9C",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  // Updated styles for custom dropdown
  customDropdown: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#444',
  },
  dropdownIcon: {
    color: '#888',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownContentIcon: {
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    width: '80%',
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(229, 77, 46, 0.1)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#444',
  },
  dropdownOptionTextSelected: {
    color: '#E54D2E',
    fontWeight: '600',
  },
  dropdownOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})

export default QuestionnaireScreen