import React, { useState, useContext, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, Switch,
  Alert, ActivityIndicator, SafeAreaView,
  ScrollView
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { logWorkoutSession } from "../services/logWorkout";

const LogWorkoutScreen = ({ route, navigation }) => {
  const { plan, exercises } = route.params;
  const { userInfo, isLoading: authLoading } = useContext(AuthContext);
  const [selected, setSelected] = useState([]);
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelected(exercises.map(e=>({
      exercise_id: e.id,
      workout_name: plan.name,
      completed: true,
      notes: ""
    })))
  }, [exercises]);

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
    // validation
    if (!duration || isNaN(+duration) || +duration<=0) {
      return Alert.alert("Error","Enter valid duration");
    }
    if (!userInfo) {
      return Alert.alert("Error","Log in first");
    }
    const done = selected.filter(s=>s.completed);
    if (done.length===0){
      return Alert.alert("Error","Select at least one exercise");
    }
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const now   = new Date().toISOString();

      // build payload
      const payload = done.map(s => ({
        user_id: userInfo.id,
        exercise_id: s.exercise_id,
        workout_name: s.workout_name,
        completed_date: today,
        duration: +duration,
        completed: s.completed ? 1 : 0,
        notes: s.notes || notes,
        created_at: now
      }));

      await logWorkoutSession(payload);

      Alert.alert("Success","Workout logged!",[
        { text:"OK", onPress:()=>navigation.navigate("Home")}
      ]);
    } catch(err){
      Alert.alert("Error",err.message);
    } finally {
      setLoading(false);
    }
  };

  if(authLoading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#E54D2E" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LOG WORKOUT</Text>
        <Text style={styles.planName}>{plan.name}</Text>
      </View>
      
      <ScrollView style={styles.formContainer}>
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
            <View key={index} style={styles.exerciseItem}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercises[index].name}</Text>
                <Switch
                  value={item.completed}
                  onValueChange={() => toggle(index)}
                  trackColor={{ false: "#f5f5f5", true: "#E54D2E" }}
                  thumbColor={item.completed ? "#FFEE9C" : "#fff"}
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
          <ActivityIndicator color="#FFEE9C" />
        ) : (
          <Text style={styles.submitButtonText}>LOG WORKOUT</Text>
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
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 16,
    color: "#FFEE9C",
    fontWeight: "600",
    letterSpacing: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFEE9C",
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  exercisesContainer: {
    marginBottom: 100, // Space for the button
  },
  exercisesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  exercisesSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  exerciseItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eaeaea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  exerciseNotes: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#eaeaea",
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#E54D2E",
    padding: 18,
    borderRadius: 15,
    margin: 20,
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonText: {
    color: "#FFEE9C",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default LogWorkoutScreen;