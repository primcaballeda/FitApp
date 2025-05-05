import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlanExercises } from '../services/api';

const WorkoutDetailScreen = ({ route, navigation }) => {
  const { plan } = route.params;
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const data = await getPlanExercises(plan.id);
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error.message);
        Alert.alert('Error', 'Failed to fetch exercises. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [plan.id]);

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseTarget}>{item.target_muscle_group}</Text>
      </View>
      <Text style={styles.exerciseDescription}>{item.description}</Text>
      <View style={styles.exerciseDetails}>
        {item.repetitions && (
          <View style={styles.detailItem}>
            <Ionicons name="repeat-outline" size={16} color="#E54D2E" />
            <Text style={styles.detailText}>{item.repetitions}</Text>
          </View>
        )}
        {item.duration && (
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#E54D2E" />
            <Text style={styles.detailText}>{item.duration}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E54D2E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
        <View style={styles.planDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#E54D2E" />
            <Text style={styles.detailText}>{plan.duration_weeks} weeks</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="fitness-outline" size={16} color="#E54D2E" />
            <Text style={styles.detailText}>
              {plan.level.charAt(0).toUpperCase() + plan.level.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.exercisesContainer}>
        <View style={styles.exercisesHeader}>
          <Text style={styles.exercisesTitle}>Exercises</Text>
          <Text style={styles.exercisesCount}>{exercises.length} exercises</Text>
        </View>

        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.exercisesList}
        />
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Log Workout', { plan, exercises })}
      >
        <Text style={styles.startButtonText}>Start Workout</Text>
      </TouchableOpacity>
    </View>
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
  planHeader: {
    backgroundColor: '#FFEE9C',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E54D2E',
    marginBottom: 10,
  },
  planDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  planDetails: {
    flexDirection: 'row',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  exercisesContainer: {
    flex: 1,
    padding: 20,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  exercisesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exercisesCount: {
    fontSize: 14,
    color: '#666',
  },
  exercisesList: {
    paddingBottom: 80,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  exerciseTarget: {
    fontSize: 12,
    color: '#E54D2E',
    backgroundColor: '#FFEE9C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  exerciseDetails: {
    flexDirection: 'row',
  },
  startButton: {
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
  startButtonText: {
    color: '#FFEE9C',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WorkoutDetailScreen;