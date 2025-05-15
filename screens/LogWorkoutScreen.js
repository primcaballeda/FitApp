import React, { useState, useContext, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, Switch,
  Alert, ActivityIndicator, SafeAreaView,
  ScrollView, Platform, Modal
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { logWorkoutSession } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

const LogWorkoutScreen = ({ route, navigation }) => {
  const { plan, exercises } = route.params;
  const { userInfo, isLoading: authLoading } = useContext(AuthContext);
  const [selected, setSelected] = useState([]);
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [dayNumber, setDayNumber] = useState(1);

  // Custom alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [successCallback, setSuccessCallback] = useState(null);

  useEffect(() => {
    setSelected(exercises.map(e => ({
      exercise_id: e.id,
      workout_name: plan.name,
      completed: true,
      notes: ""
    })));
  }, [exercises]);

  // Day number controls
  const incrementDay = () => {
    setDayNumber(prev => Math.min(prev + 1, 31)); 
  };

  const decrementDay = () => {
    setDayNumber(prev => Math.max(prev - 1, 1)); 
  };

  // Custom alert function
  const showCustomAlert = (title, message, callback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);

    // Store callback for success scenario
    if (title === 'Success' && callback) {
      setSuccessCallback(() => callback);
    }
  };

  // Handle alert dismiss with possible navigation callback
  const handleAlertDismiss = () => {
    setAlertVisible(false);

    // If this was a success alert and we have a callback, execute it
    if (alertTitle === 'Success' && successCallback) {
      successCallback();
      setSuccessCallback(null); // Clear the callback
    }
  };

  const toggle = i => {
    const copy = [...selected];
    copy[i].completed = !copy[i].completed;
    setSelected(copy);
  };

  const changeNotes = (i, text) => {
    const copy = [...selected];
    copy[i].notes = text;
    setSelected(copy);
  };

  const handleSubmit = async () => {
    console.log("Submit workout button clicked");
    
    // validation
    if (!duration || isNaN(+duration) || +duration <= 0) {
      console.log("Invalid duration entered");
      showCustomAlert("Error", "Enter valid duration");
      return;
    }
    
    if (!userInfo) {
      console.log("User not logged in");
      showCustomAlert("Error", "Log in first");
      return;
    }
    
    const done = selected.filter(s => s.completed);
    if (done.length === 0) {
      console.log("No exercises selected");
      showCustomAlert("Error", "Select at least one exercise");
      return;
    }

    try {
      setLoading(true);
      console.log("Starting workout submission");
      
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      // Make sure dayNumber is explicitly included in each entry
      const payload = done.map(s => ({
        user_id: userInfo.id,
        exercise_id: s.exercise_id,
        workout_name: s.workout_name,
        completed_date: today,
        duration: +duration,
        completed: s.completed ? 1 : 0,
        notes: s.notes || notes,
        created_at: now,
        day_number: dayNumber // This is the important part
      }));

      // Add very explicit debug logging
      console.log("About to send workout with day number:", dayNumber);
      console.log("First payload item:", JSON.stringify(payload[0]));

      await logWorkoutSession(payload);
      console.log("Workout logged successfully");

      showCustomAlert("Success", "Workout logged!", () => {
        console.log("Alert OK pressed, navigating to Home");
        navigation.reset({
          index: 0,
          routes: [{ name: "Main", state: { routes: [{ name: "Home" }] } }],
        });
      });
    } catch (err) {
      console.error("Error logging workout:", err);
      showCustomAlert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#E54D2E" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>LOG WORKOUT</Text>
        <Text style={styles.planName}>{plan.name}</Text>
      </View>

      <ScrollView style={styles.formContainer}>
        {/* Day Number Selector - Updated UI */}
        <View style={styles.dayNumberContainer}>
          <Text style={styles.inputLabel}>Workout Day</Text>
          <View style={styles.dayNumberSelector}>
            <TouchableOpacity
              onPress={decrementDay}
              style={[styles.dayButton, dayNumber <= 1 && {opacity: 0.5}]}
              disabled={dayNumber <= 1}
            >
              <Ionicons name="remove" size={24} color={dayNumber > 1 ? "#E54D2E" : "#ccc"} />
            </TouchableOpacity>
            <View style={styles.dayNumberDisplay}>
              <Text style={styles.dayNumberText}>Day {dayNumber}</Text>
            </View>
            <TouchableOpacity
              onPress={incrementDay}
              style={styles.dayButton}
            >
              <Ionicons name="add" size={24} color="#E54D2E" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionSeparator} />

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Duration (minutes)</Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Enter workout duration"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>General Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.textArea]}
            placeholder="Add notes about your workout"
            multiline={true}
          />
        </View>

        <View style={styles.exercisesContainer}>
          <Text style={styles.exercisesTitle}>Exercises</Text>
          <Text style={styles.exercisesSubtitle}>Toggle exercises you've completed</Text>

          {selected.map((item, index) => (
            <View key={index} style={[
              styles.exerciseItem, 
              item.completed && {borderLeftWidth: 4, borderLeftColor: '#E54D2E'}
            ]}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercises[index].name}</Text>
                <Switch
                  value={item.completed}
                  onValueChange={() => toggle(index)}
                  trackColor={{ false: "#f0f0f0", true: "#E54D2E" }}
                  thumbColor={item.completed ? "#FFEE9C" : "#fff"}
                  ios_backgroundColor="#f0f0f0"
                />
              </View>
              <TextInput
                placeholder="Add notes for this exercise"
                value={item.notes}
                onChangeText={t => changeNotes(index, t)}
                style={styles.exerciseNotes}
                multiline={true}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFEE9C" size="small" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>LOG WORKOUT</Text>
           
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#E54D2E",
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    color: "#FFEE9C",
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  planName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFEE9C",
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eaeaea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  exercisesContainer: {
    marginBottom: 100,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
  },
  exercisesTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  exercisesSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontStyle: "italic",
  },
  exerciseItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eaeaea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  exerciseNotes: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#eaeaea",
    minHeight: 70,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#E54D2E",
    padding: 18,
    borderRadius: 24,
    margin: 20,
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#E54D2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: "#FFEE9C",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
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
    fontSize: 20,
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
    elevation: 3,
  },
  modalButtonText: {
    color: '#FFEE9C',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  // Day number styles
  dayNumberContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
  },
  dayNumberSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayNumberDisplay: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E54D2E20',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E54D2E',
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
});

export default LogWorkoutScreen;