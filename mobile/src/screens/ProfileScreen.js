import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Text, useTheme } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';

const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Profile</Title>
          <Paragraph>Name: {user?.firstName} {user?.lastName}</Paragraph>
          <Paragraph>Email: {user?.email}</Paragraph>
          <Paragraph>Role: {user?.role}</Paragraph>
          <Paragraph>Store ID: {user?.storeId || 'N/A'}</Paragraph>
          <Paragraph>Warehouse ID: {user?.warehouseId || 'N/A'}</Paragraph>
          
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.button}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  button: {
    marginTop: 16,
  },
});

export default ProfileScreen;

