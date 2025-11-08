import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SearchableDropdown, { DropdownOption } from "../components/SearchableDropdown";
import { getHosts } from "../services/hosts";
import { createVisitor } from "../services/visitors";

const VEHICLE_CATEGORIES: DropdownOption[] = [
  { id: "motorcycle", label: "Motorcycle" },
  { id: "sedan", label: "Sedan" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "van", label: "Van" },
  { id: "other", label: "Other" },
];

export default function NewVisitor() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedHost, setSelectedHost] = useState<DropdownOption | null>(null);
  const [plateNumber, setPlateNumber] = useState("");
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<DropdownOption | null>(null);
  const [gpsId, setGpsId] = useState("");
  const [hosts, setHosts] = useState<DropdownOption[]>([]);
  const [isLoadingHosts, setIsLoadingHosts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHosts();
  }, []);

  const loadHosts = async () => {
    setIsLoadingHosts(true);
    try {
      const hostsData = await getHosts();
      const hostOptions: DropdownOption[] = hostsData.map((host) => ({
        id: host.id,
        label: host.name,
      }));
      setHosts(hostOptions);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load hosts. Please try again.");
      console.error("Error loading hosts:", error);
    } finally {
      setIsLoadingHosts(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Error", "Please enter the visitor's name");
      return;
    }
    if (!selectedHost) {
      Alert.alert("Error", "Please select a host");
      return;
    }
    if (!plateNumber.trim()) {
      Alert.alert("Error", "Please enter the plate number");
      return;
    }
    if (!selectedVehicleCategory) {
      Alert.alert("Error", "Please select a vehicle category");
      return;
    }
    if (!gpsId.trim()) {
      Alert.alert("Error", "Please enter the GPS ID");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save visitor data to Firestore
      await createVisitor(
        name,
        selectedHost.id,
        selectedHost.label,
        plateNumber,
        selectedVehicleCategory.id,
        gpsId
      );

      Alert.alert(
        "Success",
        "Visitor registered successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setName("");
              setSelectedHost(null);
              setPlateNumber("");
              setSelectedVehicleCategory(null);
              setGpsId("");
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to register visitor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>New Visitor</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter visitor's name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name of Host</Text>
            <SearchableDropdown
              options={hosts}
              value={selectedHost?.id || null}
              onSelect={setSelectedHost}
              placeholder="Select a host"
              searchPlaceholder="Search hosts..."
              isLoading={isLoadingHosts}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Plate Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter plate number"
              placeholderTextColor="#999"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Category</Text>
            <SearchableDropdown
              options={VEHICLE_CATEGORIES}
              value={selectedVehicleCategory?.id || null}
              onSelect={setSelectedVehicleCategory}
              placeholder="Select vehicle category"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>GPS ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter GPS device ID"
              placeholderTextColor="#999"
              value={gpsId}
              onChangeText={setGpsId}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    marginTop: 100,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
    padding: 12,
  },
  cancelButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

