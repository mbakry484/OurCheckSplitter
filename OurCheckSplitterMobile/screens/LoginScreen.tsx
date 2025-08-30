import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, padding } from '../utils/responsive';

interface LoginScreenProps {
  navigation?: any;
  onLoginSuccess: (token: string, user: any, isNewUser?: boolean) => Promise<void>;
}

const LoginScreen = ({ navigation, onLoginSuccess }: LoginScreenProps) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword, getIdToken } = await import('firebase/auth');
      const { auth } = await import('../firebase.config');
      
      console.log('Attempting Firebase authentication with:', email);
      
      let userCredential;
      
      if (isSignUp) {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created successfully:', userCredential.user.email);
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in successfully:', userCredential.user.email);
      }
      
      // Get Firebase ID token
      const idToken = await getIdToken(userCredential.user);
      
      const user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: userCredential.user.displayName || 'User',
      };
      
      console.log('Firebase authentication successful for:', user.email);
      
      // Call the success callback with real Firebase token and new user flag
      await onLoginSuccess(idToken, user, isSignUp);
      
      Alert.alert('Success', `Welcome ${user.displayName}!`);
      
    } catch (error: any) {
      console.error('Firebase authentication error:', error);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert(isSignUp ? 'Sign Up Failed' : 'Sign In Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // For development - bypass authentication
    const guestUser = {
      uid: 'guest-user',
      email: 'guest@example.com',
      displayName: 'Guest User',
    };
    
    await onLoginSuccess('guest-token', guestUser);
    Alert.alert('Success', 'Logged in as guest for testing!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: Math.max(50, insets.top) }]}>
        {/* Logo/Title */}
        <View style={styles.header}>
          <Text style={styles.title}>SplitWise</Text>
          <Text style={styles.subtitle}>Split bills with friends</Text>
        </View>

        {/* Auth Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, !isSignUp && styles.activeModeButton]}
            onPress={() => setIsSignUp(false)}
          >
            <Text style={[styles.modeButtonText, !isSignUp && styles.activeModeButtonText]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isSignUp && styles.activeModeButton]}
            onPress={() => setIsSignUp(true)}
          >
            <Text style={[styles.modeButtonText, isSignUp && styles.activeModeButtonText]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Development/Testing Options */}
          <View style={styles.testingSection}>
            <Text style={styles.testingTitle}>Development Mode</Text>
            <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text
              style={styles.footerLink}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 32,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeModeButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeModeButtonText: {
    color: '#007AFF',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testingSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  testingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestButton: {
    backgroundColor: '#6C757D',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default LoginScreen;