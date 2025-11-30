import { Link, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react-native";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  const { signIn } = useAuth();
  const router = useRouter();

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

  const validatePassword = (text: string) => {
    setPassword(text);
    setPasswordCriteria({
      minLength: text.length >= 8,
      hasUpper: /[A-Z]/.test(text),
      hasLower: /[a-z]/.test(text),
      hasNumber: /[0-9]/.test(text),
    });
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  // Validasi Form Lengkap
  const isFormValid =
    name.length > 0 &&
    email.length > 0 &&
    isPasswordValid &&
    !emailError &&
    validateEmailFormat(email);

  const handleRegister = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      console.log("Data user", res.data);
      signIn(res.data.token, res.data.user);
      Alert.alert("Berhasil", "Akun berhasil dibuat!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Gagal mendaftar";
      Alert.alert("Gagal", message);
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <View style={styles.reqItem}>
      {met ? (
        <CheckCircle2 size={16} color="#10B981" />
      ) : (
        <Circle size={16} color="#9CA3AF" />
      )}
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tombol Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Buat Akun Baru</Text>
            <Text style={styles.subtitle}>
              Mulai catat pengeluaranmu hari ini.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Nama */}
            <View style={styles.inputWrapper}>
              <User color="#666" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nama Lengkap"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email */}
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

            {/* Password */}
            <View>
              <View style={styles.inputWrapper}>
                <Lock color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kata Sandi"
                  value={password}
                  onChangeText={validatePassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color="#666" size={20} />
                  ) : (
                    <Eye color="#666" size={20} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.reqContainer}>
                <Text style={styles.reqTitle}>Syarat Kata Sandi:</Text>
                <RequirementItem
                  met={passwordCriteria.minLength}
                  text="Minimal 8 karakter"
                />
                <RequirementItem
                  met={passwordCriteria.hasUpper}
                  text="Huruf Besar (A-Z)"
                />
                <RequirementItem
                  met={passwordCriteria.hasLower}
                  text="Huruf Kecil (a-z)"
                />
                <RequirementItem
                  met={passwordCriteria.hasNumber}
                  text="Angka (0-9)"
                />
              </View>
            </View>

            {/* Tombol Daftar */}
            <TouchableOpacity
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>DAFTAR SEKARANG</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: "#666" }}>Sudah punya akun? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Masuk disini</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // PENTING: flexGrow 1 agar scrollview memenuhi layar
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },

  backButton: { marginBottom: 20 }, // Tidak pakai absolute lagi agar tidak jitter

  // Margin top besar sebagai pengganti justifyContent: center
  header: { marginBottom: 30, alignItems: "center", marginTop: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },

  form: { gap: 15 },
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
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 5 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: "100%" },

  reqContainer: { marginTop: 10, paddingLeft: 5 },
  reqTitle: { fontSize: 12, color: "#666", marginBottom: 5, fontWeight: "600" },
  reqItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 8,
  },
  reqText: { fontSize: 12, color: "#9CA3AF" },
  reqTextMet: { color: "#10B981", fontWeight: "500" },

  button: {
    backgroundColor: "#2563EB",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
  },
  buttonDisabled: { backgroundColor: "#9CA3AF", elevation: 0 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  link: { color: "#2563EB", fontWeight: "bold" },
});
