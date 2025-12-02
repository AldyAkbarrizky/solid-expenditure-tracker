import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "../../src/services/transaction.service";
import { useTheme } from "../../src/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, User, Tag, ShoppingBag, Utensils, Coffee, Car, Home, Zap, Smartphone, Gift, Heart, Briefcase, Film, Music, Book, MoreHorizontal, Edit2, Trash2 } from "lucide-react-native";
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Map icon strings to Lucide components (reuse from ScanScreen or move to utils)
const IconMap: Record<string, any> = {
  "shopping-bag": ShoppingBag,
  "utensils": Utensils,
  "coffee": Coffee,
  "car": Car,
  "home": Home,
  "zap": Zap,
  "smartphone": Smartphone,
  "gift": Gift,
  "heart": Heart,
  "briefcase": Briefcase,
  "film": Film,
  "music": Music,
  "book": Book,
  "more-horizontal": MoreHorizontal,
  "default": MoreHorizontal
};

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, theme } = useTheme();

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transactionService.getTransactionById(Number(id)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (transactionId: number) => transactionService.deleteTransaction(transactionId),
    onSuccess: () => {
      Alert.alert("Berhasil", "Transaksi berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStats"] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert("Gagal", error.response?.data?.message || "Gagal menghapus transaksi");
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteMutation.mutate(Number(id)),
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/transaction/edit/${id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderCategoryIcon = (iconName?: string) => {
    const IconComponent = IconMap[iconName || "default"] || IconMap["default"];
    return <IconComponent size={20} color={colors.text} />;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !transaction?.data) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Gagal memuat detail transaksi</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: colors.primary }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tx = transaction.data;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detail Transaksi</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Edit2 size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Trash2 size={20} color="#FA5252" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Amount Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.secondary }]}>Total Biaya</Text>
          <Text style={[styles.amount, { color: colors.primary }]}>{formatCurrency(Number(tx.totalAmount))}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Calendar size={16} color={colors.muted} />
            <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(tx.transactionDate)}</Text>
          </View>

          {tx.user && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <User size={16} color={colors.muted} />
              <Text style={[styles.userText, { color: colors.text }]}>Ditambahkan oleh {tx.user.name}</Text>
            </View>
          )}

          {tx.rawOcrText && (
             <View style={[styles.row, { marginTop: 8 }]}>
               <Tag size={16} color={colors.muted} />
               <Text style={[styles.userText, { color: colors.text }]}>{tx.rawOcrText}</Text>
             </View>
          )}
        </View>

        {/* Receipt Image */}
        {tx.imageUrl && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Struk</Text>
            <Image source={{ uri: tx.imageUrl }} style={styles.receiptImage} resizeMode="cover" />
          </View>
        )}

        {/* Items List */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Item ({tx.items?.length || 0})</Text>
          
          {tx.items?.map((item: any, index: number) => (
            <View key={item.id || index} style={[styles.itemRow, index < (tx.items?.length || 0) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={styles.itemIconContainer}>
                {renderCategoryIcon(item.category?.icon)}
              </View>
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemCategory, { color: colors.muted }]}>
                  {item.category?.name || "Tanpa Kategori"} • {item.qty}x
                </Text>
                {item.discountType && (
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
                    Diskon: {item.discountType === 'PERCENT' ? `${item.discountValue}%` : `Rp ${new Intl.NumberFormat("id-ID").format(Number(item.discountValue))}`}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {item.discountType && (
                    <Text style={{ fontSize: 12, color: colors.muted, textDecorationLine: 'line-through' }}>
                        {formatCurrency(Number(item.basePrice) * Number(item.qty))}
                    </Text>
                )}
                <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {formatCurrency(Number(item.price) * Number(item.qty))}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Fees List */}
        {tx.fees && tx.fees.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Biaya</Text>
            
            {tx.fees.map((fee: any, index: number) => (
              <View key={index} style={[styles.itemRow, index < (tx.fees?.length || 0) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{fee.name}</Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.text }]}>
                  {formatCurrency(Number(fee.amount))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Global Discounts List */}
        {tx.discounts && tx.discounts.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Diskon Global</Text>
            
            {tx.discounts.map((discount: any, index: number) => (
              <View key={index} style={[styles.itemRow, index < (tx.discounts?.length || 0) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{discount.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
                    {discount.type === 'PERCENT' ? `${discount.value}%` : `Rp ${new Intl.NumberFormat("id-ID").format(Number(discount.value))}`}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>
                  - {formatCurrency(Number(discount.amount))}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
  },
  userText: {
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  receiptImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemCategory: {
    fontSize: 13,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
});
