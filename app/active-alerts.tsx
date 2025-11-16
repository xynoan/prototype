import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  subscribeToViolations,
  Violation,
  ViolationStatus,
} from "../services/violations";
import type { Unsubscribe } from "firebase/firestore";

export default function ActiveAlerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToViolations(
      {
        status: [ViolationStatus.ESCALATED, ViolationStatus.PENDING],
      },
      (violations) => {
        setAlerts(violations);
        setIsLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Real-time subscription will automatically update
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeElapsed = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const getStatusColor = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.ESCALATED:
        return "#FF6B35";
      case ViolationStatus.PENDING:
        return "#FFA500";
      default:
        return "#666";
    }
  };

  const getStatusLabel = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.ESCALATED:
        return "Escalated";
      case ViolationStatus.PENDING:
        return "Pending";
      default:
        return status;
    }
  };

  const handleAlertPress = (alert: Violation) => {
    router.push({
      pathname: "/alert-detail" as any,
      params: { id: alert.id },
    } as any);
  };

  const renderAlertItem = ({ item }: { item: Violation }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => handleAlertPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.alertHeader}>
        <View style={styles.plateContainer}>
          <Text style={styles.plateNumber}>{item.plateNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.timeText}>
          {getTimeElapsed(
            item.escalatedAt || item.warningSentAt || item.detectedAt
          )}
        </Text>
      </View>
      <View style={styles.alertDetails}>
        <Text style={styles.locationText}>{item.location}</Text>
        {item.hostName && (
          <Text style={styles.hostText}>Host: {item.hostName}</Text>
        )}
        <Text style={styles.dateText}>
          Detected: {formatDate(item.detectedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Active Alerts</Text>
        <View style={styles.alertCount}>
          <Text style={styles.alertCountText}>{alerts.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active alerts</Text>
          <Text style={styles.emptySubtext}>
            All violations have been resolved or are in progress.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  alertCount: {
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    minWidth: 32,
    height: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCountText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  plateContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plateNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  alertDetails: {
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  hostText: {
    fontSize: 14,
    color: "#666",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
});

