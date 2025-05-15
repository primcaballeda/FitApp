import { useState, useContext } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { logWeight } from "../services/api"
import { AuthContext } from "../context/AuthContext"
import { eventEmitter } from "../services/EventEmitter"

const LogWeightScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext)
  const [weight, setWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [successCallback, setSuccessCallback] = useState(null)

  const showCustomAlert = (title, message, callback = null) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertVisible(true)
    if (title === "Success" && callback) {
      setSuccessCallback(() => callback)
    }
  }

  const handleAlertDismiss = () => {
    setAlertVisible(false)
    if (alertTitle === "Success" && successCallback) {
      successCallback()
      setSuccessCallback(null)
    }
  }

  const handleSubmit = async () => {
    if (!weight || isNaN(Number.parseFloat(weight))) {
      showCustomAlert("Error", "Please enter a valid weight")
      return
    }

    try {
      setLoading(true)

      const weightData = {
        weight: Number.parseFloat(weight),
        log_date: new Date().toISOString().split("T")[0],
        notes: notes || "",
      }

      await logWeight(weightData)

      showCustomAlert("Success", "Weight logged successfully!", () => {
        eventEmitter.emit("weightLogUpdated")
        setWeight("")
        setNotes("")
        navigation.navigate("Progress")
      })
    } catch (error) {
      showCustomAlert("Error", error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Custom Alert Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={alertVisible}
          onRequestClose={handleAlertDismiss}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{alertTitle}</Text>
              <Text style={styles.modalText}>{alertMessage}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAlertDismiss}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFEE9C" />
            ) : (
              <Text style={styles.submitButtonText}>Log Weight</Text>
            )}
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
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#E54D2E",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#E54D2E",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
  },
  modalButtonText: {
    color: "#FFEE9C",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
})

export default LogWeightScreen
