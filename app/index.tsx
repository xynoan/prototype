import { useRouter } from "expo-router";
import { getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { signIn } from "../services/auth";

// --- HELPER FUNCTION FOR REDIRECTING ---
const redirectUser = async (user: any, router: any) => {
    try {
        const tokenResult = await getIdTokenResult(user);
        const role = (tokenResult.claims?.role as string) || "";
        const normalized = role.toLowerCase();

        if (normalized === "guard") {
            router.replace("/guard");
            return true; // Successfully redirected
        }
        if (normalized === "bpso") {
            router.replace("/bpso"); // BPSO REDIRECT
            return true; // Successfully redirected
        }
        
        // --- ADDED FALLBACK REDIRECT HERE ---
        // If the user is logged in but has no recognized role claim, 
        // default them to the BPSO dashboard (or a generic dashboard)
        router.replace("/bpso");
        return true; 
        
    } catch (e) {
        // If fetching claims fails, we cannot determine the route,
        // so we fail the redirect (returning false)
        return false;
    }
};

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Assuming always login for now
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if user is already logged in (on app start)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await redirectUser(user, router);
      }
    });

    return unsubscribe;
  }, [router]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // 1. Sign In
        await signIn(email, password);
        const user = auth.currentUser;

        if (user) {
            // 2. Check Role and Redirect
            const redirected = await redirectUser(user, router);
            
            if (!redirected) {
                // NOTE: This block should now rarely be hit due to the fallback 
                // inside redirectUser, but it remains for theoretical safety.
                Alert.alert("Success", "Logged in successfully!");
            }
        }
      } else {
        // Sign Up logic commented out
      }
    } catch (error: any) {
      // This handles failed password/email or other Firebase sign-in errors
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome to ViolationLedger!</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Please log in to continue" : "Create your account"}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>
              {isLogin ? "Login" : "Sign Up"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 16,
    alignItems: "center",
  },
  switchButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
});