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
  MoreHorizontal,
  Camera,
  Image as ImageIcon,
  Calendar,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  unit?: string;
  categoryId?: number;
  categoryName?: string;
  basePrice?: string;
  discountType?: 'PERCENT' | 'NOMINAL';
  discountValue?: string;
};

type Fee = {
  name: string;
  amount: string;
};

type Tax = {
  name: string;
  amount: string;
  type: 'PERCENT' | 'NOMINAL';
  value: string;
};

type Discount = {
  name: string;
  amount: string;
  type: 'PERCENT' | 'NOMINAL';
  value: string;
};

import { useTheme } from "../../src/context/ThemeContext";

export default function ScanScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [transactionTitle, setTransactionTitle] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [items, setItems] = useState<TransactionItem[]>([
    { name: "", price: "", qty: "1", unit: "pcs" },
  ]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [customFeeName, setCustomFeeName] = useState("");
  const [customFeeAmount, setCustomFeeAmount] = useState("");

  // Tax State
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [taxModalVisible, setTaxModalVisible] = useState(false);
  const [customTaxName, setCustomTaxName] = useState("");
  const [customTaxType, setCustomTaxType] = useState<'PERCENT' | 'NOMINAL'>('PERCENT');
  const [customTaxValue, setCustomTaxValue] = useState("");
  
  // Global Discount State
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [customDiscountName, setCustomDiscountName] = useState("");
  const [customDiscountType, setCustomDiscountType] = useState<'PERCENT' | 'NOMINAL'>('PERCENT');
  const [customDiscountValue, setCustomDiscountValue] = useState("");
  const { colors, theme } = useTheme();
  
  // Category Selection State
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  
  // Unit Selection State
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [activeUnitItemIndex, setActiveUnitItemIndex] = useState<number | null>(null);
  const UNIT_OPTIONS = ["pcs", "kg", "gr", "liter", "ml", "box", "pack", "lusin", "kodi", "porsi", "bungkus", "botol", "kaleng", "lembar", "pasang", "set"];

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const [isScanning, setIsScanning] = useState(false);

  const handleScanReceipt = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Izin diperlukan", "Mohon izinkan akses kamera untuk scan struk");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsMultipleSelection: true, // Enable multiple selection
          selectionLimit: 5, // Limit to 5 images
        });
      }

      if (!result.canceled && result.assets.length > 0) {
        setIsScanning(true);
        try {
          const uris = result.assets.map((asset) => asset.uri);
          const data = await transactionService.scanReceipt(uris);
          
          if (data.data) {
            const { merchantName, totalAmount, items: scannedItems } = data.data;
            
            if (merchantName) setTransactionTitle(merchantName);
            
            // Map scanned items to form items
            if (scannedItems && scannedItems.length > 0) {
              const newItems = scannedItems.map((item: any) => {
                let categoryId;
                let categoryName;

                if (item.categoryName && categories?.data) {
                   const matchedCategory = categories.data.find(
                     (c: any) => c.name.toLowerCase() === item.categoryName.toLowerCase()
                   );
                   if (matchedCategory) {
                     categoryId = matchedCategory.id;
                     categoryName = matchedCategory.name;
                   }
                }

                return {
                  name: item.name || "",
                  price: item.price ? String(item.price) : "",
                  qty: item.qty ? String(item.qty) : "1",
                  categoryId,
                  categoryName,
                  basePrice: item.basePrice ? String(item.basePrice) : undefined,
                  discountType: item.discountType,
                  discountValue: item.discountValue ? String(item.discountValue) : undefined,
                };
              });
              setItems(newItems);
            } else if (totalAmount) {
              // If no items found but total exists, create one item
              setItems([{ name: "Total Purchase", price: String(totalAmount), qty: "1" }]);
            }

            if (data.data.fees && data.data.fees.length > 0) {
              const newFees = data.data.fees.map((fee: any) => ({
                name: fee.name,
                amount: String(fee.amount),
              }));
              setFees(newFees);
            }

            if (data.data.discounts && data.data.discounts.length > 0) {
              const newDiscounts = data.data.discounts.map((discount: any) => ({
                name: discount.name,
                amount: String(discount.amount),
                type: discount.type,
                value: String(discount.value),
              }));
              setDiscounts(newDiscounts);
            }
            
            Alert.alert("Berhasil", "Struk berhasil discan!");
          } else {
            Alert.alert("Data Tidak Terdeteksi", "Gagal mengekstrak detail transaksi. Silakan coba lagi dengan gambar yang lebih jelas atau input manual.");
          }
        } catch (error) {
          console.error(error);
          Alert.alert("Gagal", "Gagal scan struk. Silakan coba lagi.");
        } finally {
          setIsScanning(false);
        }
      }
    } catch (error) {
      console.error(error);
      setIsScanning(false);
    }
  };

  const totalAmount = useMemo(() => {
    const itemsTotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + price * qty;
    }, 0);

    const feesTotal = fees.reduce((sum, fee) => {
      return sum + (Number(fee.amount) || 0);
    }, 0);

    const taxesTotal = taxes.reduce((sum, tax) => {
      return sum + (Number(tax.amount) || 0);
    }, 0);

    const subTotal = itemsTotal + feesTotal + taxesTotal;

    const discountsTotal = discounts.reduce((sum, discount) => {
      return sum + (Number(discount.amount) || 0);
    }, 0);

    return Math.max(0, subTotal - discountsTotal);
  }, [items, fees, taxes, discounts]);

  const handleAddFee = () => {
    if (customFeeName && customFeeAmount) {
      setFees([...fees, { name: customFeeName, amount: customFeeAmount }]);
      setCustomFeeName("");
      setCustomFeeAmount("");
      setFeeModalVisible(false);
    }
  };

  const handleRemoveFee = (index: number) => {
    const newFees = fees.filter((_, i) => i !== index);
    setFees(newFees);
  };

  const handleAddTax = () => {
    if (customTaxName && customTaxValue) {
      let amount = 0;
      const val = Number(customTaxValue);
      
      if (customTaxType === 'PERCENT') {
        const itemsTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
        const feesTotal = fees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
        // Tax usually applies to subtotal before discount? Or after? Usually before.
        // Let's assume tax is on items + fees.
        const subTotal = itemsTotal + feesTotal;
        amount = subTotal * (val / 100);
      } else {
        amount = val;
      }

      setTaxes([...taxes, { 
        name: customTaxName, 
        amount: String(amount),
        type: customTaxType,
        value: customTaxValue
      }]);
      
      setCustomTaxName("");
      setCustomTaxValue("");
      setCustomTaxType('PERCENT');
      setTaxModalVisible(false);
    }
  };

  const handleRemoveTax = (index: number) => {
    const newTaxes = taxes.filter((_, i) => i !== index);
    setTaxes(newTaxes);
  };

  const handleAddDiscount = () => {
    if (customDiscountName && customDiscountValue) {
      let amount = 0;
      const val = Number(customDiscountValue);
      
      if (customDiscountType === 'PERCENT') {
        // Calculate based on current subtotal (Items + Fees + Taxes)
        const itemsTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
        const feesTotal = fees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
        const taxesTotal = taxes.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0);
        const subTotal = itemsTotal + feesTotal + taxesTotal;
        amount = subTotal * (val / 100);
      } else {
        amount = val;
      }

      setDiscounts([...discounts, { 
        name: customDiscountName, 
        amount: String(amount),
        type: customDiscountType,
        value: customDiscountValue
      }]);
      
      setCustomDiscountName("");
      setCustomDiscountValue("");
      setCustomDiscountType('PERCENT');
      setDiscountModalVisible(false);
    }
  };

  const handleRemoveDiscount = (index: number) => {
    const newDiscounts = discounts.filter((_, i) => i !== index);
    setDiscounts(newDiscounts);
  };

  // Validation Logic
  const isFormValid = useMemo(() => {
    const isTitleValid = transactionTitle.trim().length > 0;
    const areItemsValid = items.every(
      (item) => 
        item.name.trim().length > 0 && 
        item.price !== "" && Number(item.price) !== 0 &&
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
      formData.append("transactionDate", transactionDate.toISOString());
      
      const formattedItems = itemsData.map(item => ({
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty),
        unit: item.unit,
        categoryId: item.categoryId,
        basePrice: item.basePrice ? Number(item.basePrice) : undefined,
        discountType: item.discountType,
        discountValue: item.discountValue ? Number(item.discountValue) : undefined,
      }));

      const formattedFees = fees.map(fee => ({
        name: fee.name,
        amount: Number(fee.amount),
      }));

      const formattedTaxes = taxes.map(tax => ({
        name: tax.name,
        amount: Number(tax.amount),
        type: tax.type,
        value: Number(tax.value),
      }));

      const formattedDiscounts = discounts.map(discount => ({
        name: discount.name,
        amount: Number(discount.amount),
        type: discount.type,
        value: Number(discount.value),
      }));

      formData.append("items", JSON.stringify(formattedItems));
      formData.append("fees", JSON.stringify(formattedFees));
      formData.append("taxes", JSON.stringify(formattedTaxes));
      formData.append("discounts", JSON.stringify(formattedDiscounts));

      return transactionService.createTransaction(formData);
    },
    onSuccess: () => {
      Alert.alert("Berhasil", "Transaksi berhasil ditambahkan");
      setItems([{ name: "", price: "", qty: "1", unit: "pcs" }]);
      setTransactionTitle("");
      setFees([]);
      setTaxes([]);
      setDiscounts([]);
      setTransactionDate(new Date());
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStats"] });
      router.push("/(tabs)");
    },
    onError: (error: any) => {
      Alert.alert("Gagal", error.response?.data?.message || "Gagal menambahkan transaksi");
    },
  });

  const handleAddItem = () => {
    setItems([...items, { name: "", price: "", qty: "1", unit: "pcs" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleUpdateItem = (index: number, field: keyof TransactionItem, value: string | number) => {
    const newItems = [...items];
    let item = { ...newItems[index] };

    if (field === 'price' || field === 'qty' || field === 'basePrice' || field === 'discountValue') {
      // Allow numbers, minus sign, and dot for decimals
      const numericValue = value.toString().replace(/[^0-9-.]/g, '');
      // @ts-ignore
      item[field] = numericValue;
    } else {
      // @ts-ignore
      item[field] = value;
    }

    // Recalculate Price if Discount is active
    if (item.discountType && item.basePrice) {
        const base = Number(item.basePrice) || 0;
        const val = Number(item.discountValue) || 0;
        
        if (item.discountType === 'PERCENT') {
            item.price = String(Math.max(0, base - (base * val / 100)));
        } else {
            item.price = String(Math.max(0, base - val));
        }
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const toggleDiscount = (index: number) => {
    const newItems = [...items];
    const item = newItems[index];

    if (item.discountType) {
      // Remove Discount
      item.discountType = undefined;
      item.discountValue = undefined;
      item.basePrice = undefined;
      // Price remains as is (or should it revert? Let's keep it as is)
    } else {
      // Add Discount
      item.discountType = 'PERCENT';
      item.discountValue = '0';
      item.basePrice = item.price; // Set base price to current price
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const formatNumber = (value: string) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(Number(value));
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

  const openUnitModal = (index: number) => {
    setActiveUnitItemIndex(index);
    setUnitModalVisible(true);
  };

  const selectUnit = (unit: string) => {
    if (activeUnitItemIndex !== null) {
      const newItems = [...items];
      newItems[activeUnitItemIndex] = {
        ...newItems[activeUnitItemIndex],
        unit: unit,
      };
      setItems(newItems);
      setUnitModalVisible(false);
      setActiveUnitItemIndex(null);
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
    return <IconComponent size={24} color={colors.text} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.text }]}>Tambah Transaksi</Text>

          <View style={styles.scanButtonsContainer}>
            <TouchableOpacity 
              style={[styles.scanButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleScanReceipt(true)}
              disabled={isScanning}
            >
              {isScanning ? <ActivityIndicator size="small" color={colors.primary} /> : <Camera size={20} color={colors.primary} />}
              <Text style={[styles.scanButtonText, { color: colors.text }]}>Scan Struk</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleScanReceipt(false)}
              disabled={isScanning}
            >
              {isScanning ? <ActivityIndicator size="small" color={colors.primary} /> : <ImageIcon size={20} color={colors.primary} />}
              <Text style={[styles.scanButtonText, { color: colors.text }]}>Upload Gambar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainFormGroup}>
            <Text style={[styles.label, { color: colors.secondary }]}>Judul Transaksi</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Contoh: Belanja Bulanan di Griya"
              placeholderTextColor={colors.muted}
              value={transactionTitle}
              onChangeText={setTransactionTitle}
            />
          </View>

          <View style={styles.mainFormGroup}>
            <Text style={[styles.label, { color: colors.secondary }]}>Tanggal Transaksi</Text>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calendar size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.text }}>
                  {transactionDate.toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={transactionDate}
                mode="date"
                display="default"
                onChange={(event: any, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setTransactionDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Items</Text>

          {items.map((item, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Item {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Trash2 size={20} color="#FA5252" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.secondary }]}>Nama Item</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Contoh: Nasi Goreng"
                  placeholderTextColor={colors.muted}
                  value={item.name}
                  onChangeText={(text) => handleUpdateItem(index, "name", text)}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 2, marginRight: 12 }]}>
                  <Text style={[styles.label, { color: colors.secondary }]}>
                    {item.discountType ? "Harga Akhir (Rp)" : "Harga (Rp)"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input, 
                      { backgroundColor: item.discountType ? colors.card : colors.background, borderColor: colors.border, color: colors.text },
                      item.discountType && { opacity: 0.7 }
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={item.price}
                    onChangeText={(text) => handleUpdateItem(index, "price", text)}
                    editable={!item.discountType}
                  />
                  {item.price ? (
                    <Text style={{ fontSize: 10, color: colors.secondary, marginTop: 2 }}>
                      {formatNumber(item.price)}
                    </Text>
                  ) : null}
                </View>

                <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={[styles.label, { color: colors.secondary }]}>Jml</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="1"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={item.qty}
                    onChangeText={(text) => handleUpdateItem(index, "qty", text)}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.secondary }]}>Satuan</Text>
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}
                    onPress={() => openUnitModal(index)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.text }}>{item.unit || "pcs"}</Text>
                      <ChevronDown size={16} color={colors.muted} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Discount Section */}
              <View style={{ marginBottom: 16 }}>
                <TouchableOpacity onPress={() => toggleDiscount(index)}>
                  <Text style={{ color: colors.primary, fontWeight: '600', marginBottom: 8 }}>
                    {item.discountType ? "- Hapus Diskon" : "+ Tambah Diskon"}
                  </Text>
                </TouchableOpacity>

                {item.discountType && (
                  <View style={{ padding: 12, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: colors.secondary }]}>Harga Asli (Rp)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        keyboardType="numeric"
                        value={item.basePrice || ""}
                        onChangeText={(text) => handleUpdateItem(index, "basePrice", text)}
                      />
                      {item.basePrice ? (
                        <Text style={{ fontSize: 10, color: colors.secondary, marginTop: 2 }}>
                          {formatNumber(item.basePrice)}
                        </Text>
                      ) : null}
                    </View>
                    
                    <View style={styles.row}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                        <Text style={[styles.label, { color: colors.secondary }]}>Tipe Diskon</Text>
                        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
                          <TouchableOpacity 
                            style={{ flex: 1, padding: 12, backgroundColor: item.discountType === 'PERCENT' ? colors.primary : colors.card, alignItems: 'center' }}
                            onPress={() => handleUpdateItem(index, 'discountType', 'PERCENT')}
                          >
                            <Text style={{ color: item.discountType === 'PERCENT' ? '#fff' : colors.text, fontWeight: '600' }}>%</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ flex: 1, padding: 12, backgroundColor: item.discountType === 'NOMINAL' ? colors.primary : colors.card, alignItems: 'center' }}
                            onPress={() => handleUpdateItem(index, 'discountType', 'NOMINAL')}
                          >
                            <Text style={{ color: item.discountType === 'NOMINAL' ? '#fff' : colors.text, fontWeight: '600' }}>Rp</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={[styles.formGroup, { flex: 2 }]}>
                        <Text style={[styles.label, { color: colors.secondary }]}>Nilai Diskon</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                          placeholder="0"
                          placeholderTextColor={colors.muted}
                          keyboardType="numeric"
                          value={item.discountValue}
                          onChangeText={(text) => handleUpdateItem(index, "discountValue", text)}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.secondary }]}>Kategori</Text>
                <TouchableOpacity
                  style={[styles.categorySelector, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => openCategoryModal(index)}
                >
                  <Text style={[styles.categoryText, { color: item.categoryName ? colors.text : colors.muted }]}>
                    {item.categoryName || "Pilih Kategori"}
                  </Text>
                  <ChevronDown size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={[styles.addButton, { borderColor: colors.primary, backgroundColor: theme === 'dark' ? 'rgba(34, 139, 230, 0.1)' : 'rgba(34, 139, 230, 0.05)' }]} onPress={handleAddItem}>
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Tambah Item Lain</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Biaya Tambahan</Text>
          
          {fees.map((fee, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{fee.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveFee(index)}>
                  <Trash2 size={20} color="#FA5252" />
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                 <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.secondary }]}>Jumlah (Rp)</Text>
                    <Text style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, paddingTop: 12 }]}>
                      {formatNumber(fee.amount)}
                    </Text>
                 </View>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.addButton, { borderColor: colors.primary, backgroundColor: theme === 'dark' ? 'rgba(34, 139, 230, 0.1)' : 'rgba(34, 139, 230, 0.05)' }]} 
            onPress={() => setFeeModalVisible(true)}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Tambah Biaya</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Pajak</Text>
          
          {taxes.map((tax, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{tax.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveTax(index)}>
                  <Trash2 size={20} color="#FA5252" />
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                 <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.secondary }]}>
                      Jumlah ({tax.type === 'PERCENT' ? `${tax.value}%` : 'Rp'})
                    </Text>
                    <Text style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, paddingTop: 12 }]}>
                      {formatNumber(tax.amount)}
                    </Text>
                 </View>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.addButton, { borderColor: colors.primary, backgroundColor: theme === 'dark' ? 'rgba(34, 139, 230, 0.1)' : 'rgba(34, 139, 230, 0.05)' }]} 
            onPress={() => setTaxModalVisible(true)}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Tambah Pajak</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Diskon Global</Text>
          
          {discounts.map((discount, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{discount.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveDiscount(index)}>
                  <Trash2 size={20} color="#FA5252" />
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                 <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.secondary }]}>
                      Jumlah ({discount.type === 'PERCENT' ? `${discount.value}%` : 'Rp'})
                    </Text>
                    <Text style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, paddingTop: 12 }]}>
                      - {formatNumber(discount.amount)}
                    </Text>
                 </View>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.addButton, { borderColor: colors.primary, backgroundColor: theme === 'dark' ? 'rgba(34, 139, 230, 0.1)' : 'rgba(34, 139, 230, 0.05)' }]} 
            onPress={() => setDiscountModalVisible(true)}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Tambah Diskon Global</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Biaya</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(totalAmount)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={mutation.isPending || !isFormValid}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Simpan Transaksi</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Unit Selection Modal */}
      <Modal
        visible={unitModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUnitModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '50%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pilih Satuan</Text>
              <TouchableOpacity onPress={() => setUnitModalVisible(false)}>
                <Text style={{ color: colors.secondary }}>Tutup</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={UNIT_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryItem, { borderBottomColor: colors.border }]}
                  onPress={() => selectUnit(item)}
                >
                  <Text style={[styles.categoryItemName, { color: colors.text }]}>{item}</Text>
                  {activeUnitItemIndex !== null && items[activeUnitItemIndex].unit === item && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Tutup</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories?.data || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryItem, { borderBottomColor: colors.border }]}
                  onPress={() => selectCategory(item)}
                >
                  <View style={styles.categoryItemContent}>
                    <View style={[styles.categoryIconWrapper, { backgroundColor: colors.background }]}>
                      {renderCategoryIcon(item.icon)}
                    </View>
                    <Text style={[styles.categoryItemName, { color: colors.text }]}>{item.name}</Text>
                  </View>
                  {items[activeItemIndex!]?.categoryId === item.id && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Fee Modal */}
      <Modal
        visible={feeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Tambah Biaya</Text>
              <TouchableOpacity onPress={() => setFeeModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Tutup</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Nama Biaya</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Contoh: Ongkir, Pajak"
                placeholderTextColor={colors.muted}
                value={customFeeName}
                onChangeText={setCustomFeeName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Jumlah (Rp)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={customFeeAmount}
                onChangeText={(text) => setCustomFeeAmount(text.replace(/[^0-9-]/g, ''))}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={handleAddFee}
            >
              <Text style={styles.submitButtonText}>Tambah Biaya</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tax Modal */}
      <Modal
        visible={taxModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTaxModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Tambah Pajak</Text>
              <TouchableOpacity onPress={() => setTaxModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Tutup</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Nama Pajak</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Contoh: PPN, Service Charge"
                placeholderTextColor={colors.muted}
                value={customTaxName}
                onChangeText={setCustomTaxName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Tipe Pajak</Text>
                <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: 12, backgroundColor: customTaxType === 'PERCENT' ? colors.primary : colors.card, alignItems: 'center' }}
                    onPress={() => setCustomTaxType('PERCENT')}
                  >
                    <Text style={{ color: customTaxType === 'PERCENT' ? '#fff' : colors.text, fontWeight: '600' }}>%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: 12, backgroundColor: customTaxType === 'NOMINAL' ? colors.primary : colors.card, alignItems: 'center' }}
                    onPress={() => setCustomTaxType('NOMINAL')}
                  >
                    <Text style={{ color: customTaxType === 'NOMINAL' ? '#fff' : colors.text, fontWeight: '600' }}>Rp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Nilai Pajak</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={customTaxValue}
                  onChangeText={(text) => setCustomTaxValue(text.replace(/[^0-9-.]/g, ''))}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={handleAddTax}
            >
              <Text style={styles.submitButtonText}>Tambah Pajak</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Discount Modal */}
      <Modal
        visible={discountModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDiscountModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Global Discount</Text>
              <TouchableOpacity onPress={() => setDiscountModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Discount Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Voucher, Promo Code"
                placeholderTextColor={colors.muted}
                value={customDiscountName}
                onChangeText={setCustomDiscountName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Type</Text>
                <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: 12, backgroundColor: customDiscountType === 'PERCENT' ? colors.primary : colors.card, alignItems: 'center' }}
                    onPress={() => setCustomDiscountType('PERCENT')}
                  >
                    <Text style={{ color: customDiscountType === 'PERCENT' ? '#fff' : colors.text, fontWeight: '600' }}>%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: 12, backgroundColor: customDiscountType === 'NOMINAL' ? colors.primary : colors.card, alignItems: 'center' }}
                    onPress={() => setCustomDiscountType('NOMINAL')}
                  >
                    <Text style={{ color: customDiscountType === 'NOMINAL' ? '#fff' : colors.text, fontWeight: '600' }}>Rp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Value</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={customDiscountValue}
                  onChangeText={(text) => setCustomDiscountValue(text.replace(/[^0-9-]/g, ''))}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={handleAddDiscount}
            >
              <Text style={styles.submitButtonText}>Add Discount</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 8,
  },
  mainFormGroup: {
    marginBottom: 24,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categorySelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    marginBottom: 24,
  },
  addButtonText: {
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
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  submitButton: {
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
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
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
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryItemName: {
    fontSize: 16,
  },
  scanButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  scanButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  scanButtonText: {
    marginLeft: 8,
    fontWeight: "600",
  },
});
