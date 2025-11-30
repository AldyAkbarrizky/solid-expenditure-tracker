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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "../../src/services/transaction.service";
import { categoryService } from "../../src/services/category.service";
import { TrendingDown, Search, Calendar as CalendarIcon, X, Filter } from "lucide-react-native";

export default function HistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // New Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
  const [calendarVisible, setCalendarVisible] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const dateRange = useMemo(() => {
    if (selectedDate) {
      return {
        startDate: `${selectedDate}T00:00:00.000Z`,
        endDate: `${selectedDate}T23:59:59.999Z`,
      };
    }
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString();
    return { startDate, endDate };
  }, [selectedMonth, selectedYear, selectedDate]);

  const {
    data: transactionsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["transactions", selectedMonth, selectedYear, searchQuery, selectedCategoryId, selectedDate],
    queryFn: () =>
      transactionService.getTransactions({
        limit: 50,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        itemName: searchQuery || undefined,
        categoryId: selectedCategoryId || undefined,
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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Simple Calendar Logic
  const generateCalendarDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setCalendarVisible(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <TrendingDown size={20} color="#FF6B6B" />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>
          {item.items && item.items.length > 0
            ? item.items[0].name +
              (item.items.length > 1 ? ` +${item.items.length - 1} others` : "")
            : "Transaction"}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.transactionDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.transactionAmount}>
          -{formatCurrency(Number(item.totalAmount))}
        </Text>
        {item.items?.[0]?.category && (
          <Text style={styles.categoryLabel}>{item.items[0].category.name}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      <View style={styles.filtersWrapper}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#ADB5BD" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color="#ADB5BD" />
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
                  selectedMonth === index && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedMonth(index);
                  setSelectedDate(null); // Reset date when month changes
                }}
              >
                <Text
                  style={[
                    styles.filterText,
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
            style={[styles.secondaryChip, selectedDate ? styles.secondaryChipActive : null]} 
            onPress={() => setCalendarVisible(true)}
          >
            <CalendarIcon size={16} color={selectedDate ? "#FFF" : "#495057"} />
            <Text style={[styles.secondaryChipText, selectedDate ? styles.secondaryChipTextActive : null]}>
              {selectedDate || "Date"}
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
                  selectedCategoryId === item.id && styles.secondaryChipActive,
                ]}
                onPress={() => setSelectedCategoryId(selectedCategoryId === item.id ? null : item.id)}
              >
                <Text style={[styles.secondaryChipText, selectedCategoryId === item.id && styles.secondaryChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingRight: 16 }}
          />
        </View>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#228BE6" />
        </View>
      ) : (
        <FlatList
          data={transactionsData?.data || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions found</Text>
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
          <View style={styles.calendarContainer}>
            <Text style={styles.calendarTitle}>
              Select Date ({months[selectedMonth]} {selectedYear})
            </Text>
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calendarDay,
                    selectedDate === `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` && styles.calendarDayActive
                  ]}
                  onPress={() => handleDateSelect(day)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    selectedDate === `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` && styles.calendarDayTextActive
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  filtersWrapper: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3F5",
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
    color: "#212529",
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
    backgroundColor: "#F1F3F5",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#228BE6",
  },
  filterText: {
    fontSize: 14,
    color: "#495057",
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
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    marginRight: 8,
  },
  secondaryChipActive: {
    backgroundColor: "#228BE6",
    borderColor: "#228BE6",
  },
  secondaryChipText: {
    fontSize: 12,
    color: "#495057",
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
  categoryLabel: {
    fontSize: 10,
    color: "#868E96",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#ADB5BD",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
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
  calendarDayActive: {
    backgroundColor: "#228BE6",
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: "#212529",
  },
  calendarDayTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
