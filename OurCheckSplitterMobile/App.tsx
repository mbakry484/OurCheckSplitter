import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import FriendsScreen from './screens/FriendsScreen';
import ReceiptsScreen from './screens/ReceiptsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AddReceiptWrapper from './screens/AddReceiptWrapper';
import BillSplitResultScreen from './screens/BillSplitResultScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide the default header since screens have their own
        }}
      >
        {!isAuthenticated ? (
          // Authentication flow
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLoginSuccess={login} />}
          </Stack.Screen>
        ) : (
          // Main app flow
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="Receipts" component={ReceiptsScreen} />
            <Stack.Screen name="Profile">
              {(props) => <ProfileScreen {...props} onLogout={logout} />}
            </Stack.Screen>
            <Stack.Screen name="AddReceipt" component={AddReceiptWrapper} />
            <Stack.Screen name="BillSplitResult" component={BillSplitResultScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
