import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { useAuthStore } from '../stores/authStore';
import { useOfflineStore } from '../stores/offlineStore';
import { showMessage } from 'react-native-flash-message';

const ScanScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, token } = useAuthStore();
  const { isOnline, getItemBySku, saveCountOffline } = useOfflineStore();
  
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanningMode, setScanningMode] = useState('barcode'); // 'barcode', 'qr', 'manual'
  const [manualSku, setManualSku] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [countValue, setCountValue] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    getCameraPermission();
    // Get current active session
    loadCurrentSession();
  }, []);

  const getCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadCurrentSession = async () => {
    // TODO: Load current active session from API or local storage
    setCurrentSession({
      id: 'current-session-id',
      name: 'Current Stock Take Session',
      round: 1
    });
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setIsLoading(true);

    try {
      let sku = data;
      
      // Determine scan method based on barcode type
      let scanMethod = 'manual';
      if (type === BarCodeScanner.Constants.BarCodeType.qr) {
        scanMethod = 'qr';
      } else if (type === BarCodeScanner.Constants.BarCodeType.code128) {
        scanMethod = 'barcode';
      }

      await processScannedItem(sku, scanMethod);
    } catch (error) {
      console.error('Scan processing error:', error);
      showMessage({
        message: 'Scan Error',
        description: 'Failed to process scanned item',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processScannedItem = async (sku, scanMethod) => {
    try {
      // Try to get item from offline storage first
      let item = await getItemBySku(sku);
      
      if (!item && isOnline) {
        // If not found offline and online, try API
        // TODO: Implement API call to get item by SKU
        console.log('Item not found offline, would fetch from API');
        showMessage({
          message: 'Item Not Found',
          description: 'Item not found in local database. Please check SKU or sync data.',
          type: 'warning',
        });
        return;
      }

      if (!item) {
        showMessage({
          message: 'Item Not Found',
          description: 'Item not found. Please check SKU.',
          type: 'warning',
        });
        return;
      }

      setCurrentItem(item);
      setCountValue(1);
      setRemarks('');
      
      showMessage({
        message: 'Item Found',
        description: `${item.name} - ${item.sku}`,
        type: 'success',
      });

    } catch (error) {
      console.error('Item processing error:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to process item',
        type: 'danger',
      });
    }
  };

  const handleManualSearch = async () => {
    if (!manualSku.trim()) {
      showMessage({
        message: 'Invalid Input',
        description: 'Please enter a valid SKU',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    await processScannedItem(manualSku.trim(), 'manual');
    setIsLoading(false);
  };

  const saveCount = async () => {
    if (!currentItem || !currentSession) {
      showMessage({
        message: 'Error',
        description: 'No item or session selected',
        type: 'danger',
      });
      return;
    }

    setIsLoading(true);

    try {
      const countData = {
        session_id: currentSession.id,
        item_id: currentItem.id,
        user_id: user.id,
        device_id: 'mobile-device', // TODO: Get actual device ID
        round_number: currentSession.round,
        count_value: countValue,
        scan_method: 'manual', // Will be updated based on actual scan method
        remarks: remarks.trim(),
        counted_at: new Date().toISOString(),
      };

      await saveCountOffline(countData);

      showMessage({
        message: 'Count Saved',
        description: `Counted ${countValue} of ${currentItem.name}`,
        type: 'success',
      });

      // Reset form
      setCurrentItem(null);
      setCountValue(1);
      setRemarks('');
      setScanned(false);

    } catch (error) {
      console.error('Save count error:', error);
      showMessage({
        message: 'Save Error',
        description: 'Failed to save count',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adjustCount = (delta) => {
    const newValue = countValue + delta;
    if (newValue >= 0) {
      setCountValue(newValue);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text>Camera permission is required for scanning</Text>
        <Button onPress={getCameraPermission} style={styles.button}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Scanning Mode Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Scanning Mode</Title>
            <View style={styles.modeButtons}>
              <Button
                mode={scanningMode === 'barcode' ? 'contained' : 'outlined'}
                onPress={() => setScanningMode('barcode')}
                style={styles.modeButton}
              >
                Barcode
              </Button>
              <Button
                mode={scanningMode === 'qr' ? 'contained' : 'outlined'}
                onPress={() => setScanningMode('qr')}
                style={styles.modeButton}
              >
                QR Code
              </Button>
              <Button
                mode={scanningMode === 'manual' ? 'contained' : 'outlined'}
                onPress={() => setScanningMode('manual')}
                style={styles.modeButton}
              >
                Manual
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Camera Scanner */}
        {scanningMode !== 'manual' && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Scanner</Title>
              <View style={styles.scannerContainer}>
                <BarCodeScanner
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  style={styles.scanner}
                />
                {scanned && (
                  <Button
                    mode="contained"
                    onPress={() => setScanned(false)}
                    style={styles.rescanButton}
                  >
                    Tap to Scan Again
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Manual Input */}
        {scanningMode === 'manual' && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Manual Entry</Title>
              <TextInput
                label="Enter SKU"
                value={manualSku}
                onChangeText={setManualSku}
                style={styles.input}
                autoCapitalize="characters"
              />
              <Button
                mode="contained"
                onPress={handleManualSearch}
                loading={isLoading}
                style={styles.button}
              >
                Search Item
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Item Details and Count */}
        {currentItem && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>{currentItem.name}</Title>
              <Paragraph>SKU: {currentItem.sku}</Paragraph>
              <Paragraph>Short ID: {currentItem.short_id}</Paragraph>
              <Paragraph>
                RFID: {currentItem.has_rfid ? 'Yes' : 'No'}
              </Paragraph>
              {currentItem.description && (
                <Paragraph>{currentItem.description}</Paragraph>
              )}

              <View style={styles.countSection}>
                <Title>Count</Title>
                <View style={styles.countControls}>
                  <Button
                    mode="outlined"
                    onPress={() => adjustCount(-1)}
                    style={styles.countButton}
                  >
                    -
                  </Button>
                  <Text style={styles.countValue}>{countValue}</Text>
                  <Button
                    mode="outlined"
                    onPress={() => adjustCount(1)}
                    style={styles.countButton}
                  >
                    +
                  </Button>
                </View>

                <TextInput
                  label="Remarks (optional)"
                  value={remarks}
                  onChangeText={setRemarks}
                  style={styles.input}
                  multiline
                  numberOfLines={2}
                />

                <Button
                  mode="contained"
                  onPress={saveCount}
                  loading={isLoading}
                  style={styles.saveButton}
                >
                  Save Count
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  scannerContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  scanner: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  rescanButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  countSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  countControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  countButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  countValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
});

export default ScanScreen;
