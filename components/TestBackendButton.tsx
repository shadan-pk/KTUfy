/**
 * Backend Connection Test Component
 * Add this to any screen to test if backend is connected
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { getCurrentUserProfile } from '../services/userService';

export const TestBackendButton: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testBackend = async () => {
    setTesting(true);
    setResult('Testing...');
    
    try {
      console.log('🧪 Testing backend connection...');
      console.log('📍 Backend URL:', process.env.API_BASE_URL);
      
      // Call your backend's /api/v1/auth/me endpoint
      const profile = await getCurrentUserProfile();
      
      console.log('✅ Backend Response:', profile);
      
      setResult(`✅ Connected!\n\nName: ${profile.name}\nEmail: ${profile.email}\nReg: ${profile.registration_number}`);
      
      Alert.alert(
        '🎉 Success!',
        `Backend is connected!\n\nUser: ${profile.name}\nEmail: ${profile.email}\nRegistration: ${profile.registration_number}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Backend test failed:', error);
      setResult(`❌ Failed: ${error.message}`);
      
      Alert.alert(
        '❌ Connection Failed',
        `Could not connect to backend.\n\nError: ${error.message}\n\nCheck:\n• Backend is running\n• .env is configured\n• Check console logs`,
        [{ text: 'OK' }]
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testBackend}
        disabled={testing}
      >
        {testing ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonText}>  Testing...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>🧪 Test Backend Connection</Text>
        )}
      </TouchableOpacity>
      
      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
      
      <Text style={styles.hint}>
        Backend: {process.env.API_BASE_URL || 'Not configured'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2c3e50',
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
