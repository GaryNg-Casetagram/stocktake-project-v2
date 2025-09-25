import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Text,
  useTheme,
} from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';
import { showMessage } from 'react-native-flash-message';

const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const { login, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: 'admin@stocktake.com',
    password: 'password123',
  });

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      showMessage({
        message: 'Please fill in all fields',
        type: 'warning',
      });
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      showMessage({
        message: 'Login successful',
        type: 'success',
      });
    } else {
      showMessage({
        message: result.error || 'Login failed',
        type: 'danger',
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>StockTake</Title>
            <Paragraph style={styles.subtitle}>Sign in to your account</Paragraph>
            
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              style={styles.input}
              secureTextEntry
              autoComplete="password"
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Sign In
            </Button>

            <Text style={styles.demoText}>
              Demo credentials: admin@stocktake.com / password123
            </Text>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  demoText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 16,
  },
});

export default LoginScreen;

