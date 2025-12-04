import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { familyService } from "../../src/services/family.service";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { ArrowLeft, Edit2, Trash2, Copy, Camera, Image as ImageIcon, X } from "lucide-react-native";
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from "expo-image-picker";

export default function FamilyDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const queryClient = useQueryClient();
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [familyAvatar, setFamilyAvatar] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: familyService.getFamilyMembers,
    enabled: !!user?.familyId,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    setRefreshing(false);
  };

  const isAdmin = familyMembers?.data.family.adminId === user?.id;

  const kickMutation = useMutation({
    mutationFn: familyService.kickMember,
    onSuccess: () => {
      Alert.alert("Berhasil", "Anggota berhasil dikeluarkan.");
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
    onError: (error: any) => {
      Alert.alert("Gagal", error.response?.data?.message || "Gagal mengeluarkan anggota.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", familyName);
      if (familyAvatar) {
        const filename = familyAvatar.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("avatar", {
          uri: familyAvatar,
          name: filename,
          type,
        } as any);
      }
      return familyService.updateFamily(formData);
    },
    onSuccess: () => {
      Alert.alert("Berhasil", "Profil keluarga berhasil diperbarui.");
      setEditModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
    onError: (error: any) => {
      Alert.alert("Gagal", error.response?.data?.message || "Gagal memperbarui profil keluarga.");
    },
  });

  const handleKickMember = (memberId: number, memberName: string) => {
    Alert.alert(
      "Keluarkan Anggota",
      `Apakah Anda yakin ingin mengeluarkan ${memberName} dari keluarga?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluarkan", 
          style: "destructive", 
          onPress: () => kickMutation.mutate(memberId) 
        },
      ]
    );
  };

  const handleOpenEditModal = () => {
    if (familyMembers?.data.family) {
      setFamilyName(familyMembers.data.family.name);
      setFamilyAvatar(null); // Reset avatar selection
      setEditModalVisible(true);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Izin diperlukan", "Mohon izinkan akses kamera.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
    }

    if (!result.canceled) {
      setFamilyAvatar(result.assets[0].uri);
    }
  };

  const handleUpdateFamily = () => {
    if (!familyName.trim()) {
      Alert.alert("Error", "Nama keluarga tidak boleh kosong.");
      return;
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!familyMembers?.data) return null;

  const { family, members } = familyMembers.data;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detail Keluarga</Text>
        {isAdmin ? (
          <TouchableOpacity onPress={handleOpenEditModal}>
            <Edit2 size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <>
            <View style={[styles.familyInfoCard, { backgroundColor: colors.card }]}>
              <View style={styles.avatarContainer}>
                {family.avatarUrl ? (
                  <Image source={{ uri: family.avatarUrl }} style={styles.familyAvatar} />
                ) : (
                  <View style={[styles.familyAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.familyAvatarText}>{family.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.familyName, { color: colors.text }]}>{family.name}</Text>
              
              {family.inviteCode && (
                <TouchableOpacity 
                  style={[styles.inviteCodeContainer, { backgroundColor: colors.background }]}
                  onPress={() => {
                    Clipboard.setStringAsync(family.inviteCode);
                    Alert.alert("Disalin", "Kode undangan disalin ke clipboard!");
                  }}
                >
                  <Text style={[styles.inviteCodeLabel, { color: colors.secondary }]}>Kode Undangan</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.inviteCode, { color: colors.primary }]}>{family.inviteCode}</Text>
                    <Copy size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Anggota ({members.length})</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.memberItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.memberInfo}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.memberAvatar} />
              ) : (
                <View style={[styles.memberAvatarPlaceholder, { backgroundColor: colors.background }]}>
                  <Text style={[styles.memberAvatarText, { color: colors.text }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {item.name} {item.id === user?.id && "(Anda)"}
                </Text>
                <Text style={[styles.memberEmail, { color: colors.secondary }]}>{item.email}</Text>
                {item.id === family.adminId && (
                  <Text style={[styles.adminBadge, { color: colors.primary }]}>Admin</Text>
                )}
              </View>
            </View>
            
            {isAdmin && item.id !== user?.id && (
              <TouchableOpacity 
                onPress={() => handleKickMember(item.id, item.name)}
                style={styles.kickButton}
              >
                <Trash2 size={20} color="#FA5252" />
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Keluarga</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.editAvatarContainer}>
              <TouchableOpacity onPress={() => pickImage(false)}>
                {familyAvatar ? (
                  <Image source={{ uri: familyAvatar }} style={styles.editAvatarPreview} />
                ) : family.avatarUrl ? (
                  <Image source={{ uri: family.avatarUrl }} style={styles.editAvatarPreview} />
                ) : (
                  <View style={[styles.editAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.editAvatarText}>{familyName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.cameraIconBadge, { backgroundColor: colors.card }]}>
                  <Camera size={16} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Nama Keluarga</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Nama Keluarga"
                placeholderTextColor={colors.muted}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateFamily}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
              )}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  familyInfoCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  familyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  familyAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  familyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inviteCodeContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  inviteCodeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 12,
  },
  adminBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  kickButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
