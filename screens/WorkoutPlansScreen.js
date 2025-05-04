import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWorkoutPlans } from '../services/api';

const WorkoutPlansScreen = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = await getWorkoutPlans();
        setPlans(data);
      } catch (error) {
        console.log('Error fetching workout plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getLevelIcon = (level) => {
    switch (level) {
      case 'beginner':
        return 'leaf-outline';
      case 'intermediate':
        return 'flame-outline';
      case 'advanced':
        return 'flash-outline';
      default:
        return 'fitness-outline';
    }
  };

  const renderPlanItem = ({ item }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => navigation.navigate('Workout Detail', { plan: item })}
    >
      <View style={styles.planHeader}>
        <View style={styles.planIconContainer}>
          <Ionicons name={getLevelIcon(item.level)} size={24} color="#FFEE9C" />
        </View>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{item.name}</Text>
          <Text style={styles.planLevel}>
            {item.level.charAt(0).toUpperCase() + item.level.slice(1)} • {item.duration_weeks} weeks
          </Text>
        </View>
      </View>
      <Text style={styles.planDescription}>{item.description}</Text>
      <View style={styles.planFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#E54D2E" />
      </View>
    </TouchableOpacity>
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
      <FlatList
        data={plans}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            Choose a workout plan that matches your fitness level
          </Text>
        }
      />
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
  listContainer: {
    padding: 20,
  },
  headerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planIconContainer: {
    backgroundColor: '#E54D2E',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  planLevel: {
    fontSize: 14,
    color: '#666',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#E54D2E',
    fontWeight: 'bold',
    marginRight: 5,
  },
});

export default WorkoutPlansScreen;