import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { familyService } from "../src/services/family.service";
import { Users, UserPlus, ArrowRight } from "lucide-react-native";

import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../src/context/AuthContext";

export default function FamilySetupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [familyCode, setFamilyCode] = useState("");
  const { colors, theme } = useTheme();
  const { updateProfile } = useAuth();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  const createFamilyMutation = useMutation({
    mutationFn: (name: string) => familyService.createFamily(name),
    onSuccess: (data) => {
      setCreateModalVisible(false);
      updateProfile({ familyId: data.data.id });
      Alert.alert("Berhasil", "Keluarga berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      Alert.alert("Gagal", error.response?.data?.message || "Gagal membuat keluarga");
    },
  });

  const joinFamilyMutation = useMutation({
    mutationFn: (code: string) => familyService.joinFamily(code),
    onSuccess: (data) => {
      updateProfile({ familyId: data.data.id });
      Alert.alert("Berhasil", "Berhasil bergabung dengan keluarga!");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      Alert.alert("Gagal", error.response?.data?.message || "Gagal bergabung dengan keluarga");
    },
  });

  const handleCreateFamily = () => {
    setCreateModalVisible(true);
  };

  const submitCreateFamily = () => {
    if (!newFamilyName.trim()) {
      Alert.alert("Gagal", "Mohon masukkan nama keluarga");
      return;
    }
    createFamilyMutation.mutate(newFamilyName);
  };

  const handleJoinFamily = () => {
    if (!familyCode.trim()) {
      Alert.alert("Gagal", "Mohon masukkan kode keluarga");
      return;
    }
    joinFamilyMutation.mutate(familyCode);
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Selamat Datang! 🎉</Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              Kelola pengeluaran bersama. Gabung keluarga yang ada atau buat baru.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme === 'dark' ? 'rgba(34, 139, 230, 0.2)' : '#E7F5FF' }]}>
              <Users size={32} color="#228BE6" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Gabung Keluarga</Text>
            <Text style={[styles.cardDescription, { color: colors.secondary }]}>
              Masukkan kode unik yang dibagikan anggota keluarga Anda.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Masukkan Kode Keluarga"
              placeholderTextColor={colors.muted}
              value={familyCode}
              onChangeText={setFamilyCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoinFamily}
              disabled={joinFamilyMutation.isPending}
            >
              {joinFamilyMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Gabung Keluarga</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <Text style={[styles.dividerText, { color: colors.muted }]}>ATAU</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme === 'dark' ? 'rgba(64, 192, 87, 0.2)' : '#EBFBEE' }]}>
              <UserPlus size={32} color="#40C057" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Buat Keluarga Baru</Text>
            <Text style={[styles.cardDescription, { color: colors.secondary }]}>
              Mulai grup baru untuk pengeluaran rumah tangga Anda.
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: "#40C057", backgroundColor: 'transparent' }]}
              onPress={handleCreateFamily}
            >
              <Text style={[styles.secondaryButtonText, { color: "#40C057" }]}>
                Buat Keluarga
              </Text>
            </TouchableOpacity>
          </View>

          {!router.canGoBack() && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={[styles.skipButtonText, { color: colors.muted }]}>Lewati dulu</Text>
              <ArrowRight size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Create Family Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Buat Keluarga</Text>
              <Text style={[styles.modalSubtitle, { color: colors.secondary }]}>
                Masukkan nama untuk grup keluarga baru Anda.
              </Text>
              
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Nama Keluarga (Contoh: Keluarga Cemara)"
                placeholderTextColor={colors.muted}
                value={newFamilyName}
                onChangeText={setNewFamilyName}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]} 
                  onPress={submitCreateFamily}
                  disabled={createFamilyMutation.isPending}
                >
                  {createFamilyMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>Buat</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#228BE6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    marginVertical: 24,
    alignItems: "center",
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  secondaryButton: {
    width: "100%",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F3F5",
  },
  createButton: {
    backgroundColor: "#40C057",
  },
  cancelButtonText: {
    color: "#495057",
    fontWeight: "600",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
