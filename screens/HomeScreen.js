import React, { useState, useEffect, useContext } from "react";
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, FlatList 
} from "react-native";
import { eventEmitter } from "../services/EventEmitter";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { getUserProfile, getProgress, getWeightLogs } from "../services/api";
import { getWorkouts as getRecentWorkouts } from "../services/logWorkout";
import { format } from 'date-fns'; // Make sure to install this package

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile(userInfo?.id);
      setProfile(data);
    } catch (error) {
      console.log("Error fetching profile:", error);
    }
  };

  const fetchProgress = async () => {
    try {
      const progressData = await getProgress();
      setProgress(progressData);
    } catch (error) {
      console.log("Error fetching progress:", error);
    }
  };

  const fetchRecentWorkouts = async () => {
    try {
      setLoading(true);
      const workoutData = await getRecentWorkouts();
      setRecentWorkouts(workoutData || []);
    } catch (error) {
      console.error("Error fetching recent workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProfile(),
          fetchProgress(),
          fetchRecentWorkouts(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for workout updates
    const handleWorkoutAdded = () => {
      fetchProgress();
      fetchRecentWorkouts();
    };

    eventEmitter.on("workoutAdded", handleWorkoutAdded);
    eventEmitter.on("weightLogUpdated", fetchProfile);

    return () => {
      eventEmitter.off("workoutAdded", handleWorkoutAdded);
      eventEmitter.off("weightLogUpdated", fetchProfile);
    };
  }, [userInfo?.id]);

  const fitnessLevel = profile?.fitness_level
    ? profile.fitness_level.charAt(0).toUpperCase() +
      profile.fitness_level.slice(1)
    : "Beginner";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E54D2E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.username}>
          {profile?.name || userInfo?.username}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="fitness-outline" size={24} color="#E54D2E" />
          <Text style={styles.statValue}>{progress?.distinct_workout_count || 0}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#E54D2E" />
          <Text style={styles.statValue}>{progress?.exercise_count || 0}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={24} color="#E54D2E" />
          <Text style={styles.statValue}>{fitnessLevel}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* Motivation Section */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationTitle}>Motivation</Text>
        <Text style={styles.motivationText}>
          {progress?.motivational_tip ||
            "Start your fitness journey today! Every step counts."}
        </Text>
      </View>

      {/* Actions Section */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Workouts")}
        >
          <Ionicons name="barbell-outline" size={24} color="#FFEE9C" />
          <Text style={styles.actionButtonText}>Start Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("LogWeight")}
        >
          <Ionicons name="scale-outline" size={24} color="#FFEE9C" />
          <Text style={styles.actionButtonText}>Log Weight</Text>
        </TouchableOpacity>
      </View>

      {/* Weight Progress Section */}
      <View style={styles.weightContainer}>
        <Text style={styles.sectionTitle}>Weight Progress</Text>
        {profile?.current_weight && profile?.target_weight ? (
          <View style={styles.weightProgressContainer}>
            <View style={styles.weightInfo}>
              <Text style={styles.weightLabel}>Current</Text>
              <Text style={styles.weightValue}>
                {profile.current_weight} kg
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        profile.target_weight < profile.current_weight
                          ? 100 -
                              ((profile.current_weight -
                                profile.target_weight) /
                                profile.current_weight) *
                                100
                          : (profile.current_weight /
                              profile.target_weight) *
                              100
                      )
                    )}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.weightInfo}>
              <Text style={styles.weightLabel}>Target</Text>
              <Text style={styles.weightValue}>
                {profile.target_weight} kg
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.updateProfileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.updateProfileText}>
              Update your profile to track weight
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Workouts Section */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#E54D2E" />
        ) : recentWorkouts.length > 0 ? (
          <FlatList
            data={recentWorkouts}
            keyExtractor={(item) => item.log_id}
            renderItem={({ item }) => (
              <View style={styles.workoutItem}>
                {/* Day number displayed prominently at the top */}
                <Text style={styles.dayNumber}>
                  Day {item.day_number || 1}
                </Text>
                
                {/* Workout name displayed second */}
                <Text style={styles.workoutName}>
                  {item.workout_name}
                </Text>
                
                {/* Date displayed last */}
                <Text style={styles.workoutDate}>
                  {formatDate(item.completed_date)}
                </Text>
              </View>
            )}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts recorded yet</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Workouts')}
            >
              <Text style={styles.buttonText}>Start a Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    color: "#FFEE9C",
    fontSize: 16,
  },
  username: {
    color: "#FFEE9C",
    fontSize: 24,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "30%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  motivationCard: {
    backgroundColor: "#FFEE9C",
    borderRadius: 10,
    padding: 20,
    margin: 20,
    marginTop: 10,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E54D2E",
    marginBottom: 10,
  },
  motivationText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: "#E54D2E",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
  },
  actionButtonText: {
    color: "#FFEE9C",
    fontWeight: "bold",
    marginLeft: 10,
  },
  weightContainer: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  weightProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weightInfo: {
    alignItems: "center",
    width: "25%",
  },
  weightLabel: {
    fontSize: 12,
    color: "#666",
  },
  weightValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#E54D2E",
    borderRadius: 5,
  },
  updateProfileButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  updateProfileText: {
    color: "#666",
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  workoutItem: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "column", // Changed from row to column for stacked layout
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E54D2E",
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: "#666666",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#E54D2E",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default HomeScreen;