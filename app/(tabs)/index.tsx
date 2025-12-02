import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image
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
  History,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { useTheme } from "../../src/context/ThemeContext";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, theme } = useTheme();
  const [isFamily, setIsFamily] = useState(false);

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["monthlyStats", isFamily],
    queryFn: () => statsService.getMonthlyStats(isFamily),
  });

  const {
    data: recentTransactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["recentTransactions", isFamily],
    queryFn: () => transactionService.getTransactions({ limit: 5, family: isFamily }),
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.secondary }]}>Halo,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
          </View>
          
          <View style={styles.headerRight}>
            {user?.familyId && (
              <View style={[styles.toggleContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity 
                  style={[styles.toggleButton, !isFamily && { backgroundColor: colors.primary }]}
                  onPress={() => setIsFamily(false)}
                >
                  <Text style={[styles.toggleText, !isFamily ? { color: '#fff' } : { color: colors.secondary }]}>Saya</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleButton, isFamily && { backgroundColor: colors.primary }]}
                  onPress={() => setIsFamily(true)}
                >
                  <Text style={[styles.toggleText, isFamily ? { color: '#fff' } : { color: colors.secondary }]}>Keluarga</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}
              onPress={() => router.push("/(tabs)/profile")}
            >
              {user?.avatarUrl ? (
                <Image 
                  source={{ uri: user.avatarUrl }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{isFamily ? "Pengeluaran Keluarga" : "Pengeluaran Pribadi"}</Text>
            <TouchableOpacity 
              style={styles.quickAddButton}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.quickAddText}>Tambah</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.totalAmount}>
            {stats ? formatCurrency(stats.data.totalExpense) : "Rp 0"}
          </Text>
          <Text style={styles.periodText}>Bulan Ini</Text>
          <View style={styles.cardFooter}>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color="#FF6B6B" />
              <Text style={styles.trendText}>+12% vs bulan lalu</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaksi Terakhir</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions?.data?.length === 0 ? (
            <View style={styles.emptyState}>
              <History size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Belum ada transaksi</Text>
            </View>
          ) : (
            recentTransactions?.data?.map((transaction) => (
              <TouchableOpacity 
                key={transaction.id} 
                style={[styles.transactionItem, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/transaction/${transaction.id}` as any)}
              >
                <View style={[styles.transactionIcon, { backgroundColor: theme === 'dark' ? '#343A40' : '#FFF5F5' }]}>
                  <TrendingDown size={20} color="#FF6B6B" />
                </View>
                <View style={styles.transactionDetails}>
                  <View style={styles.transactionHeader}>
                    <Text 
                      style={[styles.transactionTitle, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {transaction.items && transaction.items.length > 0
                        ? transaction.items[0].name +
                          (transaction.items.length > 1
                            ? ` +${transaction.items.length - 1} lainnya`
                            : "")
                        : "Transaksi"}
                    </Text>
                  </View>
                  <Text style={[styles.transactionDate, { color: colors.secondary }]}>
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
                  {isFamily && transaction.user && (
                    <View style={styles.userInfoRow}>
                      <Image 
                        source={{ uri: transaction.user.avatarUrl || `https://ui-avatars.com/api/?name=${transaction.user.name}&background=random` }}
                        style={styles.miniAvatar}
                      />
                      <Text style={[styles.userNameSmall, { color: colors.secondary }]}>
                        {transaction.user.name.split(' ')[0]}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.transactionAmount}>
                  -{formatCurrency(Number(transaction.totalAmount))}
                </Text>
              </TouchableOpacity>
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
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  },
  seeAll: {
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
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
    flex: 1, // Allow title to take available space
    marginRight: 8, // Add spacing between title and avatar
  },
  transactionDate: {
    fontSize: 12,
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
    marginBottom: 4,
  },
  miniAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userNameSmall: {
    fontSize: 12,
  },
});
