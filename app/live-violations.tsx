import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  SectionList,
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

interface ViolationSection {
  title: string;
  data: Violation[];
  status: ViolationStatus;
}

export default function LiveViolations() {
  const router = useRouter();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToViolations(
      {
        status: [
          ViolationStatus.WARNING_SENT,
          ViolationStatus.PENDING,
          ViolationStatus.ESCALATED,
        ],
      },
      (violationsData) => {
        setViolations(violationsData);
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
  };

  const getTimeRemaining = (timestamp: any) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() + 30 * 60 * 1000 - now.getTime(); // 30 min warning
    if (diffMs <= 0) return null;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const groupViolationsByStatus = (violations: Violation[]): ViolationSection[] => {
    const groups = new Map<ViolationStatus, Violation[]>();

    violations.forEach((violation) => {
      if (!groups.has(violation.status)) {
        groups.set(violation.status, []);
      }
      groups.get(violation.status)!.push(violation);
    });

    const sections: ViolationSection[] = [];

    // Escalated first
    if (groups.has(ViolationStatus.ESCALATED)) {
      sections.push({
        title: `Escalated (${groups.get(ViolationStatus.ESCALATED)!.length})`,
        data: groups.get(ViolationStatus.ESCALATED)!,
        status: ViolationStatus.ESCALATED,
      });
    }

    // Warning sent (with countdown)
    if (groups.has(ViolationStatus.WARNING_SENT)) {
      sections.push({
        title: `Warning Sent (${groups.get(ViolationStatus.WARNING_SENT)!.length})`,
        data: groups.get(ViolationStatus.WARNING_SENT)!,
        status: ViolationStatus.WARNING_SENT,
      });
    }

    // Pending
    if (groups.has(ViolationStatus.PENDING)) {
      sections.push({
        title: `Pending (${groups.get(ViolationStatus.PENDING)!.length})`,
        data: groups.get(ViolationStatus.PENDING)!,
        status: ViolationStatus.PENDING,
      });
    }

    return sections;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.ESCALATED:
        return "#FF6B35";
      case ViolationStatus.WARNING_SENT:
        return "#FFA500";
      case ViolationStatus.PENDING:
        return "#FFD700";
      default:
        return "#666";
    }
  };

  const handleViolationPress = (violation: Violation) => {
    router.push({
      pathname: "/alert-detail" as any,
      params: { id: violation.id },
    } as any);
  };

  const renderViolationItem = ({ item }: { item: Violation }) => {
    const timeRemaining = getTimeRemaining(item.warningSentAt);

    return (
      <TouchableOpacity
        style={styles.violationCard}
        onPress={() => handleViolationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.violationHeader}>
          <Text style={styles.plateNumber}>{item.plateNumber}</Text>
          {timeRemaining !== null && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{timeRemaining}m left</Text>
            </View>
          )}
        </View>
        <Text style={styles.location}>{item.location}</Text>
        {item.hostName && (
          <Text style={styles.hostName}>Host: {item.hostName}</Text>
        )}
        <Text style={styles.date}>
          Detected: {formatDate(item.detectedAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: ViolationSection }) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: getStatusColor(section.status) + "20" },
      ]}
    >
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const sections = groupViolationsByStatus(violations);
  const totalActive = violations.length;
  const totalEscalated = violations.filter(
    (v) => v.status === ViolationStatus.ESCALATED
  ).length;
  const totalWarningSent = violations.filter(
    (v) => v.status === ViolationStatus.WARNING_SENT
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Violations Monitor</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalActive}</Text>
              <Text style={styles.statLabel}>Total Active</Text>
            </View>
            <View style={[styles.statCard, styles.statCardEscalated]}>
              <Text style={[styles.statValue, styles.statValueEscalated]}>
                {totalEscalated}
              </Text>
              <Text style={styles.statLabel}>Escalated</Text>
            </View>
            <View style={[styles.statCard, styles.statCardWarning]}>
              <Text style={[styles.statValue, styles.statValueWarning]}>
                {totalWarningSent}
              </Text>
              <Text style={styles.statLabel}>Warning Sent</Text>
            </View>
          </View>

          {sections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active violations</Text>
              <Text style={styles.emptySubtext}>
                All violations have been resolved.
              </Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              renderItem={renderViolationItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={styles.sectionListContent}
            />
          )}
        </ScrollView>
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardEscalated: {
    backgroundColor: "#FF6B35" + "20",
  },
  statCardWarning: {
    backgroundColor: "#FFA500" + "20",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statValueEscalated: {
    color: "#FF6B35",
  },
  statValueWarning: {
    color: "#FFA500",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
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
  sectionListContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  violationCard: {
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
  violationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  countdownBadge: {
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countdownText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  hostName: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
});

