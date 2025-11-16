import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getComplaints,
  subscribeToComplaints,
  updateComplaintStatus,
  Complaint,
  ComplaintStatus,
} from "../services/complaints";
import type { Unsubscribe } from "firebase/firestore";

export default function ComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">(
    "all"
  );

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToComplaints(
      undefined,
      (complaintsData) => {
        setComplaints(complaintsData);
        applyFilters(complaintsData, searchQuery, statusFilter);
        setIsLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyFilters(complaints, searchQuery, statusFilter);
  }, [searchQuery, statusFilter]);

  const applyFilters = (
    complaintsData: Complaint[],
    search: string,
    status: ComplaintStatus | "all"
  ) => {
    let filtered = complaintsData;

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter((c) => c.status === status);
    }

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          (c.plateNumber &&
            c.plateNumber.toLowerCase().includes(searchLower)) ||
          (c.location && c.location.toLowerCase().includes(searchLower))
      );
    }

    setFilteredComplaints(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const complaintsData = await getComplaints();
      setComplaints(complaintsData);
      applyFilters(complaintsData, searchQuery, statusFilter);
    } catch (error: any) {
      Alert.alert("Error", "Failed to refresh complaints");
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING:
        return "#FFA500";
      case ComplaintStatus.IN_REVIEW:
        return "#007AFF";
      case ComplaintStatus.RESOLVED:
        return "#4CAF50";
      case ComplaintStatus.DISMISSED:
        return "#999";
      default:
        return "#666";
    }
  };

  const handleUpdateStatus = async (
    complaintId: string,
    newStatus: ComplaintStatus
  ) => {
    try {
      await updateComplaintStatus(complaintId, newStatus);
      Alert.alert("Success", "Complaint status updated");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update status");
    }
  };

  const renderComplaintItem = ({ item }: { item: Complaint }) => (
    <TouchableOpacity
      style={styles.complaintCard}
      onPress={() => {
        Alert.alert(
          item.title,
          item.description +
            (item.plateNumber ? `\n\nPlate: ${item.plateNumber}` : "") +
            (item.location ? `\nLocation: ${item.location}` : ""),
          [
            { text: "Close", style: "cancel" },
            item.status === ComplaintStatus.PENDING && {
              text: "Mark In Review",
              onPress: () =>
                handleUpdateStatus(item.id, ComplaintStatus.IN_REVIEW),
            },
            item.status !== ComplaintStatus.RESOLVED && {
              text: "Mark Resolved",
              onPress: () =>
                handleUpdateStatus(item.id, ComplaintStatus.RESOLVED),
            },
            item.status !== ComplaintStatus.DISMISSED && {
              text: "Dismiss",
              style: "destructive" as const,
              onPress: () =>
                handleUpdateStatus(item.id, ComplaintStatus.DISMISSED),
            },
          ].filter(Boolean) as any
        );
      }}
      activeOpacity={0.7}
    >
      <View style={styles.complaintHeader}>
        <Text style={styles.complaintTitle}>{item.title}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.complaintDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.plateNumber && (
        <Text style={styles.complaintInfo}>Plate: {item.plateNumber}</Text>
      )}
      {item.location && (
        <Text style={styles.complaintInfo}>Location: {item.location}</Text>
      )}
      <Text style={styles.complaintDate}>
        {formatDate(item.createdAt)}
      </Text>
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
        <Text style={styles.headerTitle}>Complaints</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search complaints..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === "all" && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === ComplaintStatus.PENDING &&
                styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(ComplaintStatus.PENDING)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === ComplaintStatus.PENDING &&
                  styles.filterButtonTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === ComplaintStatus.IN_REVIEW &&
                styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(ComplaintStatus.IN_REVIEW)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === ComplaintStatus.IN_REVIEW &&
                  styles.filterButtonTextActive,
              ]}
            >
              In Review
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === ComplaintStatus.RESOLVED &&
                styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(ComplaintStatus.RESOLVED)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === ComplaintStatus.RESOLVED &&
                  styles.filterButtonTextActive,
              ]}
            >
              Resolved
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredComplaints.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || statusFilter !== "all"
              ? "No complaints match your filters"
              : "No complaints"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          renderItem={renderComplaintItem}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterButton: {
    flex: 1,
    minWidth: 80,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  filterButtonTextActive: {
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
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  complaintCard: {
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
  complaintHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  complaintTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  complaintDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  complaintInfo: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  complaintDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});

