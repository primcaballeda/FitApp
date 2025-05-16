import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getWeightLogs } from '../services/api';
import { eventEmitter } from "../services/EventEmitter";

const ProgressScreen = ({ userId }) => {
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeightLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      // REMOVE userId parameter - let the backend use the session
      const weightData = await getWeightLogs();
      console.log("Weight data fetched:", weightData);
      setWeightLogs(weightData || []);
    } catch (error) {
      console.log('Error fetching weight logs:', error);
      setError('Failed to load weight data');
      setWeightLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightLogs();
  }, []); 

  useEffect(() => {
    const listener = () => {
      fetchWeightLogs(); 
    };

    eventEmitter.on("weightLogUpdated", listener);

    return () => {
      eventEmitter.off("weightLogUpdated", listener);
    };
  }, []);

  const prepareWeightData = () => {
    if (!weightLogs || weightLogs.length < 2) {
      return null;
    }

    const sortedLogs = [...weightLogs]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 7) 
      .reverse(); 

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E54D2E" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weight Progress</Text>
          
          {weightLogs.length === 0 && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No weight data available</Text>
            </View>
          )}
          
          {weightLogs.length === 1 && (
            <View style={styles.singleDataContainer}>
              <Text style={styles.singleDataText}>
                You have logged your weight once. Add more logs to see your progress chart.
              </Text>
              <View style={styles.singleDataPoint}>
                <Text style={styles.singleDataValue}>{weightLogs[0].weight} kg</Text>
                <Text style={styles.singleDataDate}>
                  {(() => {
                    const date = new Date(weightLogs[0].log_date);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  })()}
                </Text>
              </View>
            </View>
          )}
          
          {weightLogs.length >= 2 && prepareWeightData() && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={prepareWeightData()}
                width={Math.max(Dimensions.get('window').width - 40, weightLogs.length * 50)} // Ensure enough width for all data points
                height={180}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(229, 77, 46, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                    paddingRight: 10,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '1',
                    stroke: '#E54D2E',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          )}
        </View>

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Your Weight Logs</Text>
          {weightLogs.length > 0 ? (
            weightLogs
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by newest first using created_at
              .map((log) => {
                const logDate = new Date(log.log_date);
                return (
                  <View key={log.id || logDate.getTime()} style={styles.logCard}>
                    <Text style={styles.logDate}>
                      {`${logDate.getMonth() + 1}/${logDate.getDate()}`}
                    </Text>
                    <Text style={styles.logWeight}>{`Weight: ${log.weight} kg`}</Text>
                    {log.notes && <Text style={styles.logNotes}>{`Notes: ${log.notes}`}</Text>}
                  </View>
                );
              })
          ) : (
            <Text style={styles.noLogsText}>No weight logs available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    color: '#E54D2E',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#E54D2E', 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 0 : 60,
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#FFEE9C',
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
    height: 180, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f5f5', 
    borderRadius: 16,
  },
  noDataText: {
    color: '#666', 
    fontSize: 16,
  },
  singleDataContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 15,
  },
  singleDataText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  singleDataPoint: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  singleDataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E54D2E',
  },
  singleDataDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logsContainer: {
    padding: 20, 
    marginTop: 10,
  },
  logsTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 10,
  },
  logCard: {
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 10,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3,
  },
  logDate: {
    fontSize: 16, 
    color: '#666',
  },
  logWeight: {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333',
  },
  logNotes: {
    fontSize: 14, 
    color: '#666', 
    marginTop: 5,
  },
  noLogsText: {
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center',
  },
});

export default ProgressScreen;