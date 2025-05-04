import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { getProgress, getWeightLogs, getWorkouts } from '../services/api';

const ProgressScreen = () => {
  const [progress, setProgress] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [progressData, weightData, workoutsData] = await Promise.all([
          getProgress(),
          getWeightLogs(),
          getWorkouts(),
        ]);
        
        setProgress(progressData);
        setWeightLogs(weightData);
        setWorkouts(workoutsData);
      } catch (error) {
        console.log('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const prepareWeightData = () => {
    if (!weightLogs || weightLogs.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [0],
            color: () => '#E54D2E',
          },
        ],
      };
    }

    // Sort by date and take last 7 entries
    const sortedLogs = [...weightLogs]
      .sort((a, b) => new Date(a.log_date) - new Date(b.log_date))
      .slice(-7);

    return {
      labels: sortedLogs.map(log => {
        const date = new Date(log.log_date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: sortedLogs.map(log => log.weight),
          color: () => '#E54D2E',
        },
      ],
    };
  };

  const getWorkoutsByMonth = () => {
    if (!workouts || workouts.length === 0) {
      return [0, 0, 0, 0, 0, 0];
    }

    const now = new Date();
    const monthCounts = Array(6).fill(0);

    workouts.forEach(workout => {
      const workoutDate = new Date(workout.completed_date);
      const monthDiff = (now.getMonth() - workoutDate.getMonth() + 12) % 12;
      
      if (monthDiff < 6 && now.getFullYear() - workoutDate.getFullYear() <= 1) {
        monthCounts[5 - monthDiff]++;
      }
    });

    return monthCounts;
  };

  const getMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const labels = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (now.getMonth() - i + 12) % 12;
      labels.push(months[monthIndex]);
    }

    return labels;
  };

  const workoutData = {
    labels: getMonthLabels(),
    datasets: [
      {
        data: getWorkoutsByMonth(),
        color: () => '#E54D2E',
      },
    ],
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="fitness-outline" size={24} color="#E54D2E" />
          <Text style={styles.statValue}>{progress?.workout_count || 0}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#E54D2E" />
          <Text style={styles.statValue}>{progress?.exercise_count || 0}</Text>
          <Text style={styles.statLabel}>Exercises Done</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weight Progress</Text>
        {weightLogs.length > 0 ? (
          <LineChart
            data={prepareWeightData()}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(229, 77, 46, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#E54D2E',
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No weight data available</Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Workout Frequency</Text>
        <LineChart
          data={workoutData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(229, 77, 46, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#E54D2E',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.motivationContainer}>
        <Text style={styles.motivationTitle}>Motivation</Text>
        <Text style={styles.motivationText}>
          {progress?.motivational_tip || "Start your fitness journey today! Every step counts."}
        </Text>
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
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFEE9C',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    padding: 20,
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
  motivationContainer: {
    backgroundColor: '#FFEE9C',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    marginTop: 0,
    marginBottom: 40,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E54D2E',
    marginBottom: 10,
  },
  motivationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default ProgressScreen;