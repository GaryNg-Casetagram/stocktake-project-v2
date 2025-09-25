import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text, useTheme } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Welcome, {user?.firstName}!</Title>
            <Paragraph>Role: {user?.role}</Paragraph>
            <Paragraph>Email: {user?.email}</Paragraph>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Scan')}
              style={styles.button}
            >
              Start Scanning
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Sessions')}
              style={styles.button}
            >
              View Sessions
            </Button>
            
            <Button
              mode="text"
              onPress={handleLogout}
              style={styles.button}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  button: {
    marginTop: 16,
  },
});

export default HomeScreen;

