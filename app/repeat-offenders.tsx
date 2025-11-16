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
import { getRepeatOffenders } from "../services/violations";
import { Violation } from "../types/violations";

interface OffenderGroup {
  plateNumber: string;
  violations: Violation[];
  count: number;
  latestViolation: Violation;
}

export default function RepeatOffenders() {
  const router = useRouter();
  const [offenders, setOffenders] = useState<OffenderGroup[]>([]);
  const [sortedOffenders, setSortedOffenders] = useState<OffenderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<"count" | "recent">("count");

  useEffect(() => {
    loadOffenders();
  }, []);

  useEffect(() => {
    sortOffenders();
  }, [sortBy, offenders]);

  const loadOffenders = async () => {
    setIsLoading(true);
    try {
      const offendersMap = await getRepeatOffenders(2);
      const offendersList: OffenderGroup[] = [];

      offendersMap.forEach((violations, plateNumber) => {
        const sortedViolations = [...violations].sort(
          (a, b) =>
            b.detectedAt.toMillis() - a.detectedAt.toMillis()
        );
        offendersList.push({
          plateNumber,
          violations,
          count: violations.length,
          latestViolation: sortedViolations[0],
        });
      });

      setOffenders(offendersList);
      sortOffenders(offendersList);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load repeat offenders");
      console.error(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const sortOffenders = (offendersList = offenders) => {
    const sorted = [...offendersList];
    if (sortBy === "count") {
      sorted.sort((a, b) => b.count - a.count);
    } else {
      sorted.sort(
        (a, b) =>
          b.latestViolation.detectedAt.toMillis() -
          a.latestViolation.detectedAt.toMillis()
      );
    }
    setSortedOffenders(sorted);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOffenders();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getSeverityColor = (count: number) => {
    if (count >= 5) return "#FF6B35";
    if (count >= 3) return "#FFA500";
    return "#FFD700";
  };

  const handleOffenderPress = (offender: OffenderGroup) => {
    Alert.alert(
      "Vehicle Violations",
      `View all ${offender.count} violations for ${offender.plateNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "View Details",
          onPress: () => {
            router.push({
              pathname: "/alert-detail" as any,
              params: { id: offender.latestViolation.id },
            } as any);
          },
        },
      ]
    );
  };

  const renderOffenderItem = ({ item }: { item: OffenderGroup }) => (
    <TouchableOpacity
      style={styles.offenderCard}
      onPress={() => handleOffenderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.offenderHeader}>
        <View style={styles.plateContainer}>
          <Text style={styles.plateNumber}>{item.plateNumber}</Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: getSeverityColor(item.count) },
            ]}
          >
            <Text style={styles.countText}>{item.count} violations</Text>
          </View>
        </View>
      </View>

      <View style={styles.offenderDetails}>
        <Text style={styles.label}>Latest Violation:</Text>
        <Text style={styles.value}>
          {item.latestViolation.violationType || "Violation"}
        </Text>
        <Text style={styles.location}>
          {item.latestViolation.location}
        </Text>
        <Text style={styles.date}>
          {formatDate(item.latestViolation.detectedAt)}
        </Text>
        {item.latestViolation.hostName && (
          <Text style={styles.hostName}>
            Host: {item.latestViolation.hostName}
          </Text>
        )}
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
        <Text style={styles.headerTitle}>Repeat Offenders</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "count" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("count")}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "count" && styles.sortButtonTextActive,
              ]}
            >
              Violation Count
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "recent" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("recent")}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "recent" && styles.sortButtonTextActive,
              ]}
            >
              Most Recent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : sortedOffenders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No repeat offenders found</Text>
          <Text style={styles.emptySubtext}>
            Vehicles with 2 or more violations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedOffenders}
          renderItem={renderOffenderItem}
          keyExtractor={(item) => item.plateNumber}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  sortContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  sortButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  sortButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
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
    fontSize: 18,
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
  offenderCard: {
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
  offenderHeader: {
    marginBottom: 12,
  },
  plateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plateNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  offenderDetails: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  location: {
    fontSize: 13,
    color: "#666",
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  hostName: {
    fontSize: 12,
    color: "#999",
  },
});

