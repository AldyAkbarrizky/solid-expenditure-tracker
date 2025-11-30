import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "../../src/services/transaction.service";
import { categoryService } from "../../src/services/category.service";
import { useRouter } from "expo-router";
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  Check,
  ShoppingBag,
  Utensils,
  Coffee,
  Car,
  Home,
  Zap,
  Smartphone,
  Gift,
  Heart,
  Briefcase,
  Film,
  Music,
  Book,
  MoreHorizontal
} from "lucide-react-native";

// Map icon strings to Lucide components
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
  // Fallback
  "default": MoreHorizontal
};

type TransactionItem = {
  name: string;
  price: string;
  qty: string;
  categoryId?: number;
  categoryName?: string;
};

export default function ScanScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [transactionTitle, setTransactionTitle] = useState("");
  const [items, setItems] = useState<TransactionItem[]>([
    { name: "", price: "", qty: "1" },
  ]);
  
  // Category Selection State
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + price * qty;
    }, 0);
  }, [items]);

  // Validation Logic
  const isFormValid = useMemo(() => {
    const isTitleValid = transactionTitle.trim().length > 0;
    const areItemsValid = items.every(
      (item) => 
        item.name.trim().length > 0 && 
        Number(item.price) > 0 && 
        Number(item.qty) > 0
    );
    return isTitleValid && areItemsValid;
  }, [transactionTitle, items]);

  const mutation = useMutation({
    mutationFn: async (itemsData: TransactionItem[]) => {
      const formData = new FormData();
      formData.append("totalAmount", totalAmount.toString());
      formData.append("type", "MANUAL");
      // Use rawOcrText to store the transaction title/description
      formData.append("rawOcrText", transactionTitle);
      
      const formattedItems = itemsData.map(item => ({
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty),
        categoryId: item.categoryId,
      }));

      formData.append("items", JSON.stringify(formattedItems));

      return transactionService.createTransaction(formData);
    },
    onSuccess: () => {
      Alert.alert("Success", "Transaction added successfully");
      setItems([{ name: "", price: "", qty: "1" }]);
      setTransactionTitle("");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStats"] });
      router.push("/(tabs)");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.response?.data?.message || "Failed to add transaction");
    },
  });

  const handleAddItem = () => {
    setItems([...items, { name: "", price: "", qty: "1" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleUpdateItem = (index: number, field: keyof TransactionItem, value: string | number) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const openCategoryModal = (index: number) => {
    setActiveItemIndex(index);
    setCategoryModalVisible(true);
  };

  const selectCategory = (category: any) => {
    if (activeItemIndex !== null) {
      const newItems = [...items];
      newItems[activeItemIndex] = {
        ...newItems[activeItemIndex],
        categoryId: category.id,
        categoryName: category.name,
      };
      setItems(newItems);
      setCategoryModalVisible(false);
      setActiveItemIndex(null);
    }
  };

  const handleSubmit = () => {
    if (!isFormValid) return;
    mutation.mutate(items);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderCategoryIcon = (iconName?: string) => {
    const IconComponent = IconMap[iconName || "default"] || IconMap["default"];
    return <IconComponent size={24} color="#495057" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Add Transaction</Text>

          <View style={styles.mainFormGroup}>
            <Text style={styles.label}>Transaction Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Belanja Bulanan di Griya"
              value={transactionTitle}
              onChangeText={setTransactionTitle}
            />
          </View>

          <Text style={styles.sectionTitle}>Items</Text>

          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Item {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Trash2 size={20} color="#FA5252" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nasi Goreng"
                  value={item.name}
                  onChangeText={(text) => handleUpdateItem(index, "name", text)}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 2, marginRight: 12 }]}>
                  <Text style={styles.label}>Price (Rp)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={item.price}
                    onChangeText={(text) => handleUpdateItem(index, "price", text)}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Qty</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    keyboardType="numeric"
                    value={item.qty}
                    onChangeText={(text) => handleUpdateItem(index, "qty", text)}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => openCategoryModal(index)}
                >
                  <Text style={[styles.categoryText, !item.categoryName && styles.placeholderText]}>
                    {item.categoryName || "Select Category"}
                  </Text>
                  <ChevronDown size={20} color="#ADB5BD" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Plus size={20} color="#228BE6" />
            <Text style={styles.addButtonText}>Add Another Item</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={mutation.isPending || !isFormValid}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Save Transaction</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories?.data || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => selectCategory(item)}
                >
                  <View style={styles.categoryItemContent}>
                    <View style={styles.categoryIconWrapper}>
                      {renderCategoryIcon(item.icon)}
                    </View>
                    <Text style={styles.categoryItemName}>{item.name}</Text>
                  </View>
                  {items[activeItemIndex!]?.categoryId === item.id && (
                    <Check size={20} color="#228BE6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 16,
    marginTop: 8,
  },
  mainFormGroup: {
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#868E96",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#212529",
  },
  categorySelector: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 16,
    color: "#212529",
  },
  placeholderText: {
    color: "#ADB5BD",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#228BE6",
    borderStyle: "dashed",
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: "rgba(34, 139, 230, 0.05)",
  },
  addButtonText: {
    color: "#228BE6",
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#495057",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#228BE6",
  },
  submitButton: {
    backgroundColor: "#228BE6",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonDisabled: {
    backgroundColor: "#A5D8FF",
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  closeButton: {
    color: "#228BE6",
    fontSize: 16,
    fontWeight: "600",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  categoryItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryItemName: {
    fontSize: 16,
    color: "#495057",
  },
});
