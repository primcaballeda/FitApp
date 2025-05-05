import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getWeightLogs } from '../services/api';
import { eventEmitter } from "../services/EventEmitter";

const ProgressScreen = ({ userId }) => {
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeightLogs = async () => {
      try {
        setLoading(true);
        const weightData = await getWeightLogs(userId);
        setWeightLogs(weightData);
      } catch (error) {
        console.log('Error fetching weight logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeightLogs();
  }, [userId]);

  useEffect(() => {
    const listener = () => {
      fetchWeightLogs(); // Fetch updated data
    };

    eventEmitter.on("weightLogUpdated", listener);

    return () => {
      eventEmitter.off("weightLogUpdated", listener);
    };
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

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weight Progress</Text>
        {weightLogs.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={prepareWeightData()}
              width={Dimensions.get('window').width - 40} // Adjust chart width to fit screen
              height={180} // Reduced height for better fit
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
                  r: '4', // Reduced dot size
                  strokeWidth: '1', // Smaller stroke width
                  stroke: '#E54D2E',
                },
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No weight data available</Text>
          </View>
        )}
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Your Weight Logs</Text>
        {weightLogs.length > 0 ? (
          weightLogs.map((log) => {
            const logDate = new Date(log.log_date);
            return (
              <View key={log.log_id} style={styles.logCard}>
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
  );
};

// Styles (adjusted for mobile-friendliness)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#E54D2E', padding: 20, paddingTop: 60,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#FFEE9C',
  },
  chartContainer: {
    padding: 20, marginBottom: 10,
  },
  chartTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    height: 180, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f5f5f5', borderRadius: 16,
  },
  noDataText: {
    color: '#666', fontSize: 16,
  },
  logsContainer: {
    padding: 20, marginTop: 10,
  },
  logsTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10,
  },
  logCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  logDate: {
    fontSize: 16, color: '#666',
  },
  logWeight: {
    fontSize: 18, fontWeight: 'bold', color: '#333',
  },
  logNotes: {
    fontSize: 14, color: '#666', marginTop: 5,
  },
  noLogsText: {
    fontSize: 16, color: '#666', textAlign: 'center',
  },
});

export default ProgressScreen;
