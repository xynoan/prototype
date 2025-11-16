import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createViolation } from "../services/violations";

const VIOLATION_TYPES = [
  "Illegal Parking",
  "No Parking Zone",
  "Handicap Zone Violation",
  "Fire Lane Violation",
  "Blocking Driveway",
  "Other",
];

const VEHICLE_CATEGORIES = [
  "motorcycle",
  "sedan",
  "suv",
  "truck",
  "van",
  "other",
];

export default function LogViolation() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [location, setLocation] = useState("");
  const [violationType, setViolationType] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("");
  const [gpsId, setGpsId] = useState("");
  const [geofenceZone, setGeofenceZone] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos of violations."
        );
      }
    })();
  }, []);

  const handleTakePhoto = async () => {
    setIsLoadingCamera(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to take photo");
      console.error(error);
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!plateNumber.trim()) {
      Alert.alert("Error", "Please enter the plate number");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Error", "Please enter the location");
      return;
    }
    if (!violationType) {
      Alert.alert("Error", "Please select a violation type");
      return;
    }

    setIsSubmitting(true);
    try {
      // Note: In production, upload photo to Firebase Storage first
      // For now, we'll use the URI as-is (base64 or URL)
      const photoUrl = photoUri || undefined;

      await createViolation(
        plateNumber,
        location,
        violationType,
        gpsId || undefined,
        geofenceZone || undefined,
        undefined, // hostId - would need to look up
        hostName || undefined,
        hostPhone || undefined,
        photoUrl,
        notes || undefined
      );

      Alert.alert(
        "Success",
        "Violation logged successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to log violation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log New Violation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Plate Number *</Text>
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
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location/address"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Violation Type *</Text>
            <View style={styles.optionsContainer}>
              {VIOLATION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    violationType === type && styles.optionButtonSelected,
                  ]}
                  onPress={() => setViolationType(type)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      violationType === type && styles.optionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Category</Text>
            <View style={styles.optionsContainer}>
              {VEHICLE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.optionButton,
                    vehicleCategory === category && styles.optionButtonSelected,
                  ]}
                  onPress={() => setVehicleCategory(category)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      vehicleCategory === category && styles.optionTextSelected,
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>GPS ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter GPS device ID (optional)"
              placeholderTextColor="#999"
              value={gpsId}
              onChangeText={setGpsId}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Geofence Zone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter geofence zone (optional)"
              placeholderTextColor="#999"
              value={geofenceZone}
              onChangeText={setGeofenceZone}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Host Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter host name (optional)"
              placeholderTextColor="#999"
              value={hostName}
              onChangeText={setHostName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Host Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter host phone (optional)"
              placeholderTextColor="#999"
              value={hostPhone}
              onChangeText={setHostPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Photo</Text>
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoUri(null)}
                >
                  <Text style={styles.removePhotoText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtonsContainer}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={handleTakePhoto}
                  disabled={isLoadingCamera}
                >
                  {isLoadingCamera ? (
                    <ActivityIndicator color="#007AFF" />
                  ) : (
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoButton, styles.photoButtonSecondary]}
                  onPress={handlePickImage}
                >
                  <Text
                    style={[
                      styles.photoButtonText,
                      styles.photoButtonTextSecondary,
                    ]}
                  >
                    Pick from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes (optional)"
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
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
              <Text style={styles.submitButtonText}>Submit Violation</Text>
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
  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  photoButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  photoButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  photoButtonTextSecondary: {
    color: "#007AFF",
  },
  photoContainer: {
    alignItems: "center",
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  removePhotoButton: {
    padding: 8,
  },
  removePhotoText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
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

