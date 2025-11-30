import { Link } from "expo-router";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // State Error
  const [emailError, setEmailError] = useState("");

  const { signIn } = useAuth();

  // Validasi Email Helper
  const validateEmailFormat = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleValidateEmail = (text: string) => {
    if (!text) {
      setEmailError("");
      return false;
    }
    if (!validateEmailFormat(text)) {
      setEmailError("Format email tidak valid");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Cek apakah Form Valid (untuk disable button)
  const isFormValid =
    email.length > 0 &&
    password.length > 0 &&
    !emailError &&
    validateEmailFormat(email);

  const handleLogin = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      signIn(res.data.token, res.data.user);
    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.message || "Terjadi kesalahan sistem";
      Alert.alert("Gagal Masuk", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Selamat Datang!</Text>
            <Text style={styles.subtitle}>
              Masuk untuk kelola pengeluaran keluarga.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <View>
              <View
                style={[
                  styles.inputWrapper,
                  emailError ? styles.inputError : null,
                ]}
              >
                <Mail
                  color={emailError ? "#EF4444" : "#666"}
                  size={20}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Alamat Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) handleValidateEmail(text);
                  }}
                  onBlur={() => handleValidateEmail(email)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {emailError && <AlertCircle color="#EF4444" size={20} />}
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Lock color="#666" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kata Sandi"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff color="#666" size={20} />
                ) : (
                  <Eye color="#666" size={20} />
                )}
              </TouchableOpacity>
            </View>

            {/* Tombol Masuk */}
            <TouchableOpacity
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>MASUK</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: "#666" }}>Belum punya akun? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Daftar Sekarang</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1 },
  innerContainer: {
    flex: 1,
    justifyContent: "center", // Tetap center konten, tapi dibungkus ScrollView flexGrow
    padding: 20,
    minHeight: "100%", // Memastikan layout stretch full height
  },

  header: { marginBottom: 40, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
  form: { gap: 20 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    backgroundColor: "#f9f9f9",
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 5, marginLeft: 5 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: "100%" },

  button: {
    backgroundColor: "#2563EB",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
  },
  buttonDisabled: { backgroundColor: "#9CA3AF", elevation: 0 }, // Style Disabled
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  link: { color: "#2563EB", fontWeight: "bold" },
});
