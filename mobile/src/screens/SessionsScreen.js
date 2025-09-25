import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Text, useTheme } from 'react-native-paper';

const SessionsScreen = ({ navigation }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Sessions</Title>
          <Paragraph>Manage your stock take sessions</Paragraph>
          
          <Text style={styles.comingSoon}>
            Sessions management coming soon...
          </Text>
          
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Scan')}
            style={styles.button}
          >
            Start New Session
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
  comingSoon: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  button: {
    marginTop: 16,
  },
});

export default SessionsScreen;

