import { useState, useContext, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { logWeight } from "../services/api"
import { AuthContext } from "../context/AuthContext"
import { eventEmitter } from "../services/EventEmitter";

const LogWeightScreen = ({ navigation }) => {
  const { userInfo, isLoading: authLoading } = useContext(AuthContext)
  const [weight, setWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Check if user is authenticated, if necessary, just log them without it
  useEffect(() => {
    if (!authLoading && !userInfo) {
      console.log("User is not logged in, but continuing anyway without authentication.")
    } else if (userInfo) {
      console.log("User logged in as:", userInfo.username)
    }
  }, [userInfo, authLoading])

  // Handle the form submission
  const handleSubmit = async () => {
    if (!weight || isNaN(Number.parseFloat(weight))) {
      Alert.alert("Error", "Please enter a valid weight")
      return
    }

    try {
      setLoading(true)

      const weightData = {
        weight: Number.parseFloat(weight),
        log_date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
        notes: notes || "",
        user_id_debug: 7, // Use a static user ID or any user ID you prefer
      }

      console.log("Submitting weight data:", weightData)

      const response = await logWeight(weightData)
      console.log("Weight log response:", response)

      Alert.alert("Success", "Weight logged successfully!", [
        {
          text: "OK",
          onPress: () => {
            eventEmitter.emit("weightLogUpdated")
            navigation.navigate("Progress")
          },
        },
      ])
    } catch (error) {
      console.error("Error logging weight:", error)
      Alert.alert("Error", error.message || "Failed to log weight")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E54D2E" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFEE9C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Weight</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Enter your current weight"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about your weight"
              multiline
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFEE9C" /> : <Text style={styles.submitButtonText}>Log Weight</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#E54D2E",
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFEE9C",
  },
  formContainer: {
    padding: 20,
    flex: 1,
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
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#E54D2E",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFEE9C",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default LogWeightScreen
