import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { LogOut, User, Settings, ChevronRight, Users, X, Copy } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import { useQuery } from "@tanstack/react-query";
import { familyService } from "../../src/services/family.service";

import { useTheme } from "../../src/context/ThemeContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();
  
  const { data: familyMembers } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: familyService.getFamilyMembers,
    enabled: !!user?.familyId,
  });

  const handleLogout = () => {
    Alert.alert("Keluar", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <View style={[styles.avatar, { backgroundColor: colors.card }]}>
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
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: colors.secondary }]}>{user?.email}</Text>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={[styles.zoomedAvatar, { backgroundColor: colors.card }]}>
              {user?.avatarUrl ? (
                <Image 
                  source={{ uri: user.avatarUrl }} 
                  style={styles.zoomedAvatarImage} 
                />
              ) : (
                <Text style={[styles.zoomedAvatarText, { color: colors.text }]}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setModalVisible(false)}
          >
            <X color="#fff" size={30} />
          </TouchableOpacity>
        </View>
      </Modal>

      {user?.familyId && familyMembers && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.familyHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.secondary, marginBottom: 4 }]}>Anggota Keluarga</Text>
              <Text style={[styles.familyName, { color: colors.text }]}>{familyMembers.data.family.name}</Text>
            </View>
            {familyMembers.data.family.inviteCode && (
              <TouchableOpacity 
                style={[styles.inviteCodeContainer, { backgroundColor: colors.background }]}
                onPress={() => {
                  Clipboard.setStringAsync(familyMembers.data.family.inviteCode);
                  Alert.alert("Disalin", "Kode undangan disalin ke clipboard!");
                }}
              >
                <Text style={[styles.inviteCodeLabel, { color: colors.secondary }]}>Kode Undangan:</Text>
                <View style={styles.codeWrapper}>
                  <Text style={[styles.inviteCode, { color: colors.primary }]}>{familyMembers.data.family.inviteCode}</Text>
                  <Copy size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.membersList}>
            {familyMembers.data.members.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={[styles.memberAvatar, { backgroundColor: colors.background }]}>
                  {member.avatarUrl ? (
                    <Image 
                      source={{ uri: member.avatarUrl }} 
                      style={styles.memberAvatarImage} 
                    />
                  ) : (
                    <Text style={[styles.memberAvatarText, { color: colors.text }]}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {member.id === user.id ? "Anda" : member.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push("/profile/edit-profile")}
        >
          <View style={styles.menuItemLeft}>
            <User size={20} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Profil</Text>
          </View>
          <ChevronRight size={20} color={colors.muted} />
        </TouchableOpacity>

        {!user?.familyId && (
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/family-setup")}
          >
            <View style={styles.menuItemLeft}>
              <Users size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Gabung / Buat Keluarga</Text>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
          onPress={() => router.push("/settings")}
        >
          <View style={styles.menuItemLeft}>
            <Settings size={20} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Pengaturan</Text>
          </View>
          <ChevronRight size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#FFFFFF" />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
  },
  menuContainer: {
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#FA5252",
    borderRadius: 12,
    shadowColor: "#FA5252",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedAvatar: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedAvatarText: {
    fontSize: 120,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  zoomedAvatarImage: {
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 30,
    padding: 10,
  },
  membersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  memberItem: {
    alignItems: "center",
    width: 60,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  memberAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  memberName: {
    fontSize: 12,
    textAlign: "center",
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  familyName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inviteCodeContainer: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  inviteCodeLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
