import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getViolationById,
  updateViolationStatus,
  ViolationStatus,
} from "../services/violations";

export default function AlertDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [violation, setViolation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadViolation();
  }, [params.id]);

  const loadViolation = async () => {
    if (!params.id) return;
    setIsLoading(true);
    try {
      const data = await getViolationById(params.id);
      setViolation(data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load violation details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const handleContactHost = () => {
    if (!violation?.hostPhone) {
      Alert.alert("Info", "No phone number available for this host");
      return;
    }
    Linking.openURL(`tel:${violation.hostPhone}`);
  };

  const handleSendSMS = () => {
    if (!violation?.hostPhone) {
      Alert.alert("Info", "No phone number available for this host");
      return;
    }
    Linking.openURL(`sms:${violation.hostPhone}`);
  };

  const handleIssueTicket = async () => {
    if (!violation) return;

    Alert.alert(
      "Issue Ticket",
      "Are you sure you want to issue a ticket for this violation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Issue Ticket",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateViolationStatus(
                violation.id,
                ViolationStatus.RESOLVED,
                { ticketIssued: true }
              );
              Alert.alert("Success", "Ticket issued successfully");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to issue ticket");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkResolved = async () => {
    if (!violation) return;

    Alert.alert(
      "Mark as Resolved",
      "Has this violation been resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Host Complied",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateViolationStatus(
                violation.id,
                ViolationStatus.HOST_COMPLIED
              );
              Alert.alert("Success", "Violation marked as resolved");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to update status");
            } finally {
              setIsUpdating(false);
            }
          },
        },
        {
          text: "Manually Resolved",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateViolationStatus(
                violation.id,
                ViolationStatus.RESOLVED
              );
              Alert.alert("Success", "Violation marked as resolved");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to update status");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ViolationStatus.ESCALATED:
        return "#FF6B35";
      case ViolationStatus.PENDING:
        return "#FFA500";
      case ViolationStatus.WARNING_SENT:
        return "#FFD700";
      case ViolationStatus.RESOLVED:
        return "#4CAF50";
      case ViolationStatus.HOST_COMPLIED:
        return "#4CAF50";
      default:
        return "#666";
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      </View>
    );
  }

  if (!violation) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Violation not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Violation Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.label}>Plate Number</Text>
            <Text style={styles.value}>{violation.plateNumber}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(violation.status) },
              ]}
            >
              <Text style={styles.statusText}>{violation.status}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{violation.location}</Text>
          </View>

          {violation.geofenceZone && (
            <View style={styles.section}>
              <Text style={styles.label}>Geofence Zone</Text>
              <Text style={styles.value}>{violation.geofenceZone}</Text>
            </View>
          )}

          {violation.hostName && (
            <View style={styles.section}>
              <Text style={styles.label}>Host Name</Text>
              <Text style={styles.value}>{violation.hostName}</Text>
            </View>
          )}

          {violation.hostPhone && (
            <View style={styles.section}>
              <Text style={styles.label}>Host Phone</Text>
              <Text style={styles.value}>{violation.hostPhone}</Text>
            </View>
          )}

          {violation.violationType && (
            <View style={styles.section}>
              <Text style={styles.label}>Violation Type</Text>
              <Text style={styles.value}>{violation.violationType}</Text>
            </View>
          )}

          {violation.notes && (
            <View style={styles.section}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{violation.notes}</Text>
            </View>
          )}

          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>Timeline</Text>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Detected</Text>
              <Text style={styles.timelineValue}>
                {formatDate(violation.detectedAt)}
              </Text>
            </View>
            {violation.warningSentAt && (
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Warning Sent</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(violation.warningSentAt)}
                </Text>
              </View>
            )}
            {violation.escalatedAt && (
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Escalated</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(violation.escalatedAt)}
                </Text>
              </View>
            )}
            {violation.resolvedAt && (
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Resolved</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(violation.resolvedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {violation.hostPhone && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleContactHost}
                disabled={isUpdating}
              >
                <Text style={styles.actionButtonText}>Call Host</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSendSMS}
                disabled={isUpdating}
              >
                <Text style={styles.actionButtonText}>Send SMS</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.ticketButton]}
            onPress={handleIssueTicket}
            disabled={isUpdating || violation.ticketIssued}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {violation.ticketIssued ? "Ticket Already Issued" : "Issue Ticket"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.resolveButton]}
            onPress={handleMarkResolved}
            disabled={isUpdating}
          >
            <Text style={styles.actionButtonText}>Mark as Resolved</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  backButtonHeader: {
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
  loader: {
    marginTop: 100,
  },
  errorText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 100,
  },
  backButton: {
    marginTop: 20,
    padding: 16,
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: "#333",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  timeline: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: "#666",
  },
  timelineValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  ticketButton: {
    backgroundColor: "#FF6B35",
  },
  resolveButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

