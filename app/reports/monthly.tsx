import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { statsService } from "../../src/services/stats.service";
import { useTheme } from "../../src/context/ThemeContext";
import { ArrowLeft, Calendar, User, Users } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PieChart } from "react-native-chart-kit";
import { ReportStats } from "../../src/types";

const screenWidth = Dimensions.get("window").width;

export default function MonthlyReportScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [isFamily, setIsFamily] = useState(false);
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["report", startDate.toISOString(), endDate.toISOString(), isFamily],
    queryFn: () => statsService.getReport(startDate.toISOString(), endDate.toISOString(), isFamily),
  });

  const stats: ReportStats | undefined = reportData?.data;

  const categoryChartData = useMemo(() => {
    if (!stats?.categoryStats) return [];
    return stats.categoryStats.map((cat) => ({
      name: cat.categoryName,
      population: Number(cat.total),
      color: cat.color || "#808080",
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }, [stats, colors.text]);

  const memberChartData = useMemo(() => {
    if (!stats?.memberStats) return [];
    const colorsList = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
    return stats.memberStats.map((member, index) => ({
      name: member.userName,
      population: Number(member.total),
      color: colorsList[index % colorsList.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
      avatarUrl: member.avatarUrl,
    }));
  }, [stats, colors.text]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Laporan Pengeluaran</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Filters */}
        <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Calendar size={16} color={colors.secondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.secondary }}>-</Text>
            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Calendar size={16} color={colors.secondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !isFamily && { backgroundColor: colors.primary }]}
              onPress={() => setIsFamily(false)}
            >
              <User size={16} color={!isFamily ? "#fff" : colors.secondary} />
              <Text style={[styles.toggleText, !isFamily && { color: "#fff" }]}>Pribadi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isFamily && { backgroundColor: colors.primary }]}
              onPress={() => setIsFamily(true)}
            >
              <Users size={16} color={isFamily ? "#fff" : colors.secondary} />
              <Text style={[styles.toggleText, isFamily && { color: "#fff" }]}>Keluarga</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event: any, selectedDate: Date | undefined) => {
              setShowStartPicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event: any, selectedDate: Date | undefined) => {
              setShowEndPicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
          />
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
              <Text style={styles.summaryValue}>{formatCurrency(stats?.totalExpense || 0)}</Text>
            </View>

            {/* Category Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Pengeluaran per Kategori</Text>
              {categoryChartData.length > 0 ? (
                <View>
                  <View style={styles.chartContainer}>
                    <View style={styles.chartWrapper}>
                      <PieChart
                        data={categoryChartData}
                        width={160}
                        height={160}
                        chartConfig={{
                          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"40"}
                        center={[0, 0]}
                        absolute
                        hasLegend={false}
                      />
                      {/* Donut Hole */}
                      <View style={[styles.donutHole, { backgroundColor: colors.card }]} />
                    </View>
                    
                    {/* Custom Legend */}
                    <View style={styles.legendContainer}>
                      {categoryChartData.map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                          <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.legendValue, { color: colors.secondary }]}>
                            {((item.population / (stats?.totalExpense || 1)) * 100).toFixed(0)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Progress Bars */}
                  <View style={styles.progressContainer}>
                    {categoryChartData.map((item, index) => {
                      const percentage = (item.population / (stats?.totalExpense || 1)) * 100;
                      return (
                        <View key={index} style={styles.progressItem}>
                          <View style={styles.progressHeader}>
                            <Text style={[styles.progressLabel, { color: colors.text, marginLeft: 0 }]}>{item.name}</Text>
                            <Text style={[styles.progressValue, { color: colors.text }]}>
                              {formatCurrency(item.population)}
                            </Text>
                          </View>
                          <View style={[styles.progressBarBackground, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <View 
                              style={[
                                styles.progressBarFill, 
                                { 
                                  width: `${percentage}%`,
                                  backgroundColor: item.color 
                                }
                              ]} 
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <Text style={{ color: colors.secondary, textAlign: 'center', marginVertical: 20 }}>
                  Tidak ada data pengeluaran.
                </Text>
              )}
            </View>

            {/* Member Chart (Family Only) */}
            {isFamily && (
              <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>Pengeluaran per Anggota</Text>
                {memberChartData.length > 0 ? (
                  <View>
                    <View style={styles.chartContainer}>
                      <View style={styles.chartWrapper}>
                        <PieChart
                          data={memberChartData}
                          width={160}
                          height={160}
                          chartConfig={{
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                          }}
                          accessor={"population"}
                          backgroundColor={"transparent"}
                          paddingLeft={"40"}
                          center={[0, 0]}
                          absolute
                          hasLegend={false}
                        />
                        {/* Donut Hole */}
                        <View style={[styles.donutHole, { backgroundColor: colors.card }]} />
                      </View>
                      
                      {/* Custom Legend */}
                      <View style={styles.legendContainer}>
                        {memberChartData.map((item, index) => (
                          <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={[styles.legendValue, { color: colors.secondary }]}>
                              {((item.population / (stats?.totalExpense || 1)) * 100).toFixed(0)}%
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Progress Bars */}
                    <View style={styles.progressContainer}>
                      {memberChartData.map((item, index) => {
                        const percentage = (item.population / (stats?.totalExpense || 1)) * 100;
                        return (
                          <View key={index} style={styles.progressItem}>
                            <View style={styles.progressHeader}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {item.avatarUrl ? (
                                  <Image source={{ uri: item.avatarUrl }} style={styles.memberAvatar} />
                                ) : (
                                  <View style={[styles.memberAvatarPlaceholder, { backgroundColor: colors.border }]}>
                                    <User size={12} color={colors.secondary} />
                                  </View>
                                )}
                                <Text style={[styles.progressLabel, { color: colors.text }]}>{item.name}</Text>
                              </View>
                              <Text style={[styles.progressValue, { color: colors.text }]}>
                                {formatCurrency(item.population)}
                              </Text>
                            </View>
                            <View style={[styles.progressBarBackground, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                              <View 
                                style={[
                                  styles.progressBarFill, 
                                  { 
                                    width: `${percentage}%`,
                                    backgroundColor: item.color 
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <Text style={{ color: colors.secondary, textAlign: 'center', marginVertical: 20 }}>
                    Tidak ada data pengeluaran.
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  filterContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#808080',
  },
  summaryCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutHole: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 24,
    width: '100%',
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  memberAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
