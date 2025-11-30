import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { statsService } from "../../src/services/stats.service";
import { transactionService } from "../../src/services/transaction.service";
import {
  Bell,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Plus,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["monthlyStats"],
    queryFn: statsService.getMonthlyStats,
  });

  const {
    data: recentTransactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: transactionService.getRecentTransactions,
  });

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchTransactions();
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = statsLoading || transactionsLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarPlaceholder}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Total Expense</Text>
            <TouchableOpacity 
              style={styles.quickAddButton}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.quickAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.totalAmount}>
            {stats ? formatCurrency(stats.data.totalExpense) : "Rp 0"}
          </Text>
          <Text style={styles.periodText}>This Month</Text>
          <View style={styles.cardFooter}>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color="#FF6B6B" />
              <Text style={styles.trendText}>+12% vs last month</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions (Optional placeholder) */}
        {/* <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text>Add Income</Text>
          </TouchableOpacity>
        </View> */}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions?.data?.length === 0 ? (
            <View style={styles.emptyState}>
              <History size={48} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            recentTransactions?.data?.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <TrendingDown size={20} color="#FF6B6B" />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>
                    {transaction.items && transaction.items.length > 0
                      ? transaction.items[0].name +
                        (transaction.items.length > 1
                          ? ` +${transaction.items.length - 1} others`
                          : "")
                      : "Transaction"}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.transactionDate).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>
                  -{formatCurrency(Number(transaction.totalAmount))}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: "#6C757D",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9ECEF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#495057",
  },
  summaryCard: {
    backgroundColor: "#228BE6",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#228BE6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  quickAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quickAddText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  totalAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  periodText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  seeAll: {
    color: "#228BE6",
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#ADB5BD",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FA5252",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    color: "#ADB5BD",
  },
});
