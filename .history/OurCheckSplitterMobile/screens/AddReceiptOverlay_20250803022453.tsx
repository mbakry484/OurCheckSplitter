import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddReceiptOverlayProps {
  visible: boolean;
  onClose: () => void;
  onNext: (basicData: BasicReceiptData) => void;
}

export interface BasicReceiptData {
  receiptName: string;
  date: string;
  finalTotal: string;
  tax: string;
  tips: string;
  tipsIncluded: boolean;
}

const AddReceiptOverlay = ({ visible, onClose, onNext }: AddReceiptOverlayProps) => {
  const [receiptName, setReceiptName] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString());
  const [finalTotal, setFinalTotal] = useState('');
  const [tax, setTax] = useState('');
  const [tips, setTips] = useState('');
  const [tipsIncluded, setTipsIncluded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleNext = () => {
    // Validation
    if (!receiptName.trim()) {
      Alert.alert('Missing Information', 'Please enter a receipt name.');
      return;
    }
    
    if (!finalTotal.trim()) {
      Alert.alert('Missing Information', 'Please enter the final total.');
      return;
    }

    const finalTotalNum = parseFloat(finalTotal);
    if (isNaN(finalTotalNum) || finalTotalNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid final total amount.');
      return;
    }

    // Pass data to next stage
    const basicData: BasicReceiptData = {
      receiptName: receiptName.trim(),
      date: date.trim(),
      finalTotal: finalTotal.trim(),
      tax: tax.trim(),
      tips: tips.trim(),
      tipsIncluded,
    };

    onNext(basicData);
  };

  const handleClose = () => {
    // Reset form
    setReceiptName('');
    setDate(new Date().toLocaleDateString());
    setFinalTotal('');
    setTax('');
    setTips('');
    setTipsIncluded(false);
    setShowDatePicker(false);
    onClose();
  };

  const handleDateSelect = () => {
    // Simple date picker using prompt for now
    // In a production app, you'd want to use a proper date picker library
    Alert.prompt(
      'Select Date',
      'Enter date (MM/DD/YYYY)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: (newDate) => {
            if (newDate && newDate.trim()) {
              setDate(newDate.trim());
            }
          }
        }
      ],
      'plain-text',
      date
    );
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      // Try to parse and format the date
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString();
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Receipt</Text>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Receipt visual representation */}
          <View style={styles.receiptContainer}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptPerforation} />
            </View>
            
            <View style={styles.receiptContent}>
              {/* Receipt Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Receipt Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={receiptName}
                  onChangeText={setReceiptName}
                  placeholder="Enter receipt name"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Date */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Final Total */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Final total</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={finalTotal}
                  onChangeText={setFinalTotal}
                  placeholder="$0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Tax */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Tax</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={tax}
                  onChangeText={setTax}
                  placeholder="$0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Tips */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Tips</Text>
                <View style={styles.tipsRow}>
                  <TextInput
                    style={[styles.fieldInput, styles.tipsInput]}
                    value={tips}
                    onChangeText={setTips}
                    placeholder="$0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.tipsIncludedContainer}>
                    <Text style={styles.tipsIncludedText}>Tips Included</Text>
                    <Switch
                      value={tipsIncluded}
                      onValueChange={setTipsIncluded}
                      trackColor={{ false: '#E5E5E5', true: '#4ECDC4' }}
                      thumbColor={tipsIncluded ? 'white' : '#f4f3f4'}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.receiptFooter}>
              <View style={styles.receiptPerforation} />
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            Fill in the basic receipt information to get started. You'll be able to add items and split details on the next screen.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    alignItems: 'center',
  },
  receiptContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  receiptHeader: {
    height: 16,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  receiptFooter: {
    height: 16,
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  receiptPerforation: {
    flex: 1,
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    marginHorizontal: 8,
  },
  receiptContent: {
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tipsInput: {
    flex: 1,
  },
  tipsIncludedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsIncludedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
});

export default AddReceiptOverlay;