import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    height: '',
    current_weight: '',
    target_weight: '',
    fitness_level: 'beginner',
  });

  // Define API_URL to avoid the undefined variable error
  const API_URL = process.env.REACT_APP_API_URL || 'https://api.yourapp.com';

  // Custom alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [successCallback, setSuccessCallback] = useState(null);
  
  // Confirmation dialog state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);

  // Add state to track dropdown visibility
  const [genderDropdownVisible, setGenderDropdownVisible] = useState(false);
  const [fitnessDropdownVisible, setFitnessDropdownVisible] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile(userInfo.id);
        setProfile(data);

        setFormData({
          name: data.name || '',
          age: data.age ? data.age.toString() : '',
          gender: data.gender || 'Male',
          height: data.height ? data.height.toString() : '',
          current_weight: data.current_weight ? data.current_weight.toString() : '',
          target_weight: data.target_weight ? data.target_weight.toString() : '',
          fitness_level: data.fitness_level || 'beginner',
        });
      } catch (error) {
        console.log('Error fetching profile:', error);
        showAlert('Error', 'Failed to fetch profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Custom alert function
  const showAlert = (title, message, callback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
    
    // Store callback for success scenario if provided
    if (callback) {
      setSuccessCallback(() => callback);
    }
  };

  // Handle alert dismiss with possible callback
  const handleAlertDismiss = () => {
    setAlertVisible(false);
    
    if (successCallback) {
      successCallback();
      setSuccessCallback(null); // Clear the callback
    }
  };

  // Custom confirm dialog function
  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmCallback(() => onConfirm);
    setConfirmVisible(true);
  };

  // Handle confirm dialog actions
  const handleConfirmYes = () => {
    setConfirmVisible(false);
    if (confirmCallback) {
      confirmCallback();
      setConfirmCallback(null);
    }
  };

  const handleConfirmNo = () => {
    setConfirmVisible(false);
    setConfirmCallback(null);
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updatedProfile = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
      };

      await updateUserProfile(userInfo.id, updatedProfile);

      showAlert('Success', 'Profile updated successfully!');
    } catch (error) {
      showAlert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showConfirmDialog('Logout', 'Are you sure you want to logout?', async () => {
      try {
        await logout(); // should clear storage/context
        
        // Check if navigation object exists and has reset method
        if (navigation && navigation.reset) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } else if (typeof window !== 'undefined') {
          // For web, redirect to login page
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error during logout:', error);
        showAlert('Error', 'Failed to logout. Please try again.');
      }
    });
  };

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_URL}/debug-session`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log("Session debug info:", data);
      showAlert(
        "Session Info",
        `User ID: ${data.user_id || 'Not set'}\nAuthenticated: ${data.has_session ? 'Yes' : 'No'}`
      );
    } catch (error) {
      console.error("Error checking session:", error);
      showAlert("Error", "Failed to check session");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E54D2E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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

      {/* Confirmation Dialog Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmVisible}
        onRequestClose={() => handleConfirmNo()}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{confirmTitle}</Text>
            <Text style={styles.modalText}>{confirmMessage}</Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => handleConfirmNo()}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handleConfirmYes()}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.profileIconContainer}>
          <Ionicons name="person" size={46} color="#FFEE9C" />
        </View>
        <Text style={styles.username}>{userInfo?.username}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFEE9C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.iconInputContainer}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder="Enter your full name"
            />
            <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Age</Text>
          <View style={styles.iconInputContainer}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={formData.age}
              onChangeText={(text) => handleChange('age', text)}
              placeholder="Enter your age"
              keyboardType="number-pad"
            />
            <Ionicons name="calendar-outline" size={20} style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Gender</Text>
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

        <Text style={styles.sectionTitle}>Body Measurements</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={formData.height}
            onChangeText={(text) => handleChange('height', text)}
            placeholder="Enter your height in cm"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.current_weight}
            onChangeText={(text) => handleChange('current_weight', text)}
            placeholder="Enter your current weight in kg"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Target Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.target_weight}
            onChangeText={(text) => handleChange('target_weight', text)}
            placeholder="Enter your target weight in kg"
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.sectionTitle}>Fitness Level</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Fitness Level</Text>
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

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFEE9C" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#E54D2E',
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30, // More pronounced curve
    borderBottomRightRadius: 30, // More pronounced curve
    paddingTop: 60,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  profileIconContainer: {
    backgroundColor: 'rgba(255, 238, 156, 0.3)',
    width: 90, // Slightly larger
    height: 90, // Slightly larger
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 238, 156, 0.6)',
  },
  username: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFEE9C',
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFEE9C',
    marginLeft: 5,
    fontWeight: '600',
  },
  formContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 0.5,
    position: 'relative',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(229, 77, 46, 0.2)', // Light version of primary color
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#E54D2E',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: "#E54D2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFEE9C',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 320,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E54D2E',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#E54D2E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minWidth: 100,
    elevation: 3,
  },
  modalButtonText: {
    color: '#FFEE9C',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#666',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#E54D2E',
    marginLeft: 10,
  },
  inputIcon: {
    position: 'absolute',
    right: 18,
    top: '50%',
    transform: [{ translateY: -12 }],
    color: '#888',
  },
  iconInputContainer: {
    position: 'relative',
  },
  inputWithIcon: {
    paddingRight: 40,
  },
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
});

export default ProfileScreen;