import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "../../src/services/transaction.service";
import { categoryService } from "../../src/services/category.service";
import { TrendingDown, Search, Calendar as CalendarIcon, X, Filter, Users } from "lucide-react-native";

import { useTheme } from "../../src/context/ThemeContext";

import { familyService } from "../../src/services/family.service";
import { useAuth } from "../../src/context/AuthContext";

import { useRouter } from "expo-router";

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // +1 because 0 is "Semua"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { colors, theme } = useTheme();
  
  // New Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isFamily, setIsFamily] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: familyService.getFamilyMembers,
    enabled: !!user?.familyId && isFamily,
  });

  const dateRange = useMemo(() => {
    if (selectedDate) {
      return {
        startDate: `${selectedDate}T00:00:00.000Z`,
        endDate: `${selectedDate}T23:59:59.999Z`,
      };
    }
    
    if (selectedMonth === 0) {
      return { startDate: undefined, endDate: undefined };
    }

    const monthIndex = selectedMonth - 1;
    const startDate = new Date(selectedYear, monthIndex, 1).toISOString();
    const endDate = new Date(selectedYear, monthIndex + 1, 0).toISOString();
    return { startDate, endDate };
  }, [selectedMonth, selectedYear, selectedDate]);

  const {
    data: transactionsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["transactions", selectedMonth, selectedYear, searchQuery, selectedCategoryId, selectedDate, isFamily, selectedMemberId],
    queryFn: () =>
      transactionService.getTransactions({
        limit: 50,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        itemName: searchQuery || undefined,
        categoryId: selectedCategoryId || undefined,
        family: isFamily,
        filterUserId: selectedMemberId || undefined,
      }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const months = [
    "Semua",
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Simple Calendar Logic
  const generateCalendarDays = () => {
    const monthIndex = selectedMonth === 0 ? new Date().getMonth() : selectedMonth - 1;
    const year = selectedYear;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateSelect = (day: number) => {
    const monthIndex = selectedMonth === 0 ? new Date().getMonth() : selectedMonth - 1;
    const dateStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setCalendarVisible(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.transactionItem, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/transaction/${item.id}` as any)}
    >
      <View style={[styles.transactionIcon, { backgroundColor: theme === 'dark' ? '#343A40' : '#FFF5F5' }]}>
        <TrendingDown size={20} color="#FF6B6B" />
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionHeader}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>
            {item.items && item.items.length > 0
              ? item.items[0].name +
                (item.items.length > 1 ? ` +${item.items.length - 1} lainnya` : "")
              : "Transaksi"}
          </Text>
        </View>
        <Text style={[styles.transactionDate, { color: colors.secondary }]}>
          {new Date(item.transactionDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {isFamily && item.user && (
          <View style={styles.userInfoRow}>
            <Image 
              source={{ uri: item.user.avatarUrl || `https://ui-avatars.com/api/?name=${item.user.name}&background=random` }}
              style={styles.miniAvatar}
            />
            <Text style={[styles.userNameSmall, { color: colors.secondary }]}>
              {item.user.name.split(' ')[0]}
            </Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.transactionAmount}>
          -{formatCurrency(Number(item.totalAmount))}
        </Text>
        {item.items?.[0]?.category && (
          <Text style={[styles.categoryLabel, { color: colors.secondary }]}>{item.items[0].category.name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Riwayat Transaksi</Text>
      </View>

      <View style={[styles.filtersWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <Search size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cari item..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <FlatList
            data={months}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.background },
                  selectedMonth === index && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setSelectedMonth(index);
                  setSelectedDate(null); // Reset date when month changes
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: colors.text },
                    selectedMonth === index && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filterContent}
          />
        </View>

        {/* Secondary Filters (Date & Category) */}
        <View style={styles.secondaryFilters}>
          <TouchableOpacity 
            style={[styles.secondaryChip, { backgroundColor: colors.background, borderColor: colors.border }, isFamily ? { backgroundColor: colors.primary, borderColor: colors.primary } : null]} 
            onPress={() => setIsFamily(!isFamily)}
          >
            <Users size={16} color={isFamily ? "#FFF" : colors.text} />
            <Text style={[styles.secondaryChipText, { color: colors.text }, isFamily ? styles.secondaryChipTextActive : null]}>
              Keluarga
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryChip, { backgroundColor: colors.background, borderColor: colors.border }, selectedDate ? { backgroundColor: colors.primary, borderColor: colors.primary } : null]} 
            onPress={() => setCalendarVisible(true)}
          >
            <CalendarIcon size={16} color={selectedDate ? "#FFF" : colors.text} />
            <Text style={[styles.secondaryChipText, { color: colors.text }, selectedDate ? styles.secondaryChipTextActive : null]}>
              {selectedDate || "Tanggal"}
            </Text>
            {selectedDate && (
              <TouchableOpacity onPress={clearDateFilter} style={{ marginLeft: 4 }}>
                <X size={14} color="#FFF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <FlatList
            data={categories?.data || []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.secondaryChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  selectedCategoryId === item.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedCategoryId(selectedCategoryId === item.id ? null : item.id)}
              >
                <Text style={[styles.secondaryChipText, { color: colors.text }, selectedCategoryId === item.id && styles.secondaryChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingRight: 16 }}
          />
        </View>

        {/* Family Member Filter (Only visible when Family mode is active) */}
        {isFamily && user?.familyId && (
          <View style={styles.memberFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberFilterContent}>
              <TouchableOpacity
                style={[
                  styles.memberChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  selectedMemberId === null && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setSelectedMemberId(null)}
              >
                <Text style={[styles.memberChipText, { color: colors.text }, selectedMemberId === null && { color: '#FFF' }]}>Semua</Text>
              </TouchableOpacity>
              
              {familyMembers?.data?.members?.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberChip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    selectedMemberId === member.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedMemberId(selectedMemberId === member.id ? null : member.id)}
                >
                  {member.avatarUrl ? (
                    <Image source={{ uri: member.avatarUrl }} style={styles.memberChipAvatar} />
                  ) : (
                    <View style={[styles.memberChipAvatarPlaceholder, { backgroundColor: colors.card }]}>
                      <Text style={{ fontSize: 10, color: colors.text }}>{member.name.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={[styles.memberChipText, { color: colors.text }, selectedMemberId === member.id && { color: '#FFF' }]}>
                    {member.id === user.id ? "Anda" : member.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactionsData?.data || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Tidak ada transaksi ditemukan</Text>
            </View>
          }
        />
      )}

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarVisible(false)}>
          <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.calendarTitle, { color: colors.text }]}>
              Pilih Tanggal ({selectedMonth === 0 ? months[new Date().getMonth() + 1] : months[selectedMonth]} {selectedYear})
            </Text>
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calendarDay,
                    selectedDate === `${selectedYear}-${String((selectedMonth === 0 ? new Date().getMonth() : selectedMonth - 1) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` && { backgroundColor: colors.primary, borderRadius: 20 }
                  ]}
                  onPress={() => handleDateSelect(day)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    { color: colors.text },
                    selectedDate === `${selectedYear}-${String((selectedMonth === 0 ? new Date().getMonth() : selectedMonth - 1) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` && styles.calendarDayTextActive
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  filtersWrapper: {
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  monthSelector: {
    marginTop: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  secondaryFilters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: "center",
  },
  secondaryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  secondaryChipText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  secondaryChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FA5252",
  },
  categoryLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    borderRadius: 16,
    padding: 20,
    width: "80%",
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  calendarDayText: {
    fontSize: 14,
  },
  calendarDayTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
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
  memberFilterContainer: {
    marginTop: 12,
  },
  memberFilterContent: {
    paddingHorizontal: 16,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  memberChipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  memberChipAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
