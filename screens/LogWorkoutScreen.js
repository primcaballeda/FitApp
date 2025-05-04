import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logWorkout } from '../services/api';

const LogWorkoutScreen = ({ route, navigation }) => {
  const { plan, exercises } = route.params;
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize selected exercises
    const initialExercises = exercises.map(exercise => ({
      exercise_id: exercise.id,
      name: exercise.name,
      completed: true,
      notes: '',
    }));
    setSelectedExercises(initialExercises);
  }, [exercises]);

  const toggleExerciseCompletion = (index) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[index].completed = !updatedExercises[index].completed;
    setSelectedExercises(updatedExercises);
  };

  const updateExerciseNotes = (index, text) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[index].notes = text;
    setSelectedExercises(updatedExercises);
  };

  const handleSubmit = async () => {
    if (!duration || isNaN(parseInt(duration))) {
      Alert.alert('Error', 'Please enter a valid workout duration');
      return;
    }

    try {
      setLoading(true);
      
      const workoutData = {
        workout_id: `${plan.id}`,
        completed_date: new Date().toISOString().split('T')[0],
        duration: parseInt(duration),
        notes: notes,
        exercises: selectedExercises.map(ex => ({
          exercise_id: ex.exercise_id,
          completed: ex.completed,
          notes: ex.notes,
        })),
      };
      
      await logWorkout(workoutData);
      
      Alert.alert(
        'Success',
        'Workout logged successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to log workout');
    } finally {
      setLoading(false);
    }
  };

  const renderExerciseItem = ({ item, index }) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Switch
          value={item.completed}
          onValueChange={() => toggleExerciseCompletion(index)}
          trackColor={{ false: '#f0f0f0', true: '#FFEE9C' }}
          thumbColor={item.completed ? '#E54D2E' : '#ccc'}
        />
      </View>
      <TextInput
        style={styles.exerciseNotes}
        placeholder="Add notes (optional)"
        value={item.notes}
        onChangeText={(text) => updateExerciseNotes(index, text)}
        multiline
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Your Workout</Text>
        <Text style={styles.planName}>{plan.name}</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="Enter duration"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about your workout"
            multiline
          />
        </View>

        <Text style={styles.exercisesTitle}>Exercises</Text>
        <Text style={styles.exercisesSubtitle}>
          Mark the exercises you've completed
        </Text>

        <FlatList
          data={selectedExercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.exercisesList}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFEE9C" />
        ) : (
          <Text style={styles.submitButtonText}>Log Workout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#E54D2E',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    color: '#FFEE9C',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFEE9C',
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  exercisesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  exercisesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  exercisesList: {
    paddingBottom: 80,
  },
  exerciseItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  exerciseNotes: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#E54D2E',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  submitButtonText: {
    color: '#FFEE9C',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LogWorkoutScreen;