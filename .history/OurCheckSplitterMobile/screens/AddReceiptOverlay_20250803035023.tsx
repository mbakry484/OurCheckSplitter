import React, { useState, useEffect } from 'react';
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
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, fontSize, padding, height, width, screenDimensions } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddReceiptOverlayProps {
  visible: boolean;
  onClose: () => void;
  onNext: (basicData: BasicReceiptData) => void;
  initialData?: BasicReceiptData | null;
}

export interface BasicReceiptData {
  receiptName: string;
  date: string;
  finalTotal: string;
  tax: string;
  tips: string;
  tipsIncluded: boolean;
}

const AddReceiptOverlay = ({ visible, onClose, onNext, initialData }: AddReceiptOverlayProps) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const [receiptName, setReceiptName] = useState(initialData?.receiptName || '');
  const [selectedDate, setSelectedDate] = useState(
    initialData?.date ? new Date(initialData.date) : new Date()
  );
  const [finalTotal, setFinalTotal] = useState(initialData?.finalTotal || '');
  const [tax, setTax] = useState(initialData?.tax || '');
  const [tips, setTips] = useState(initialData?.tips || '');
  const [tipsIncluded, setTipsIncluded] = useState(initialData?.tipsIncluded || false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarPressed, setCalendarPressed] = useState(false);

  // Update state when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setReceiptName(initialData.receiptName || '');
      setSelectedDate(initialData.date ? new Date(initialData.date) : new Date());
      setFinalTotal(initialData.finalTotal || '');
      setTax(initialData.tax || '');
      setTips(initialData.tips || '');
      setTipsIncluded(initialData.tipsIncluded || false);
    }
  }, [initialData]);

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
      date: selectedDate.toLocaleDateString(),
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
    setSelectedDate(new Date());
    setFinalTotal('');
    setTax('');
    setTips('');
    setTipsIncluded(false);
    setShowDatePicker(false);
    onClose();
  };

  const handleDateSelect = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleDatePickerDismiss = () => {
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
             <View style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
                     {/* Header */}
           <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {initialData ? 'Edit Receipt' : 'New Receipt'}
            </Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>

                     {/* Scrollable Content */}
           <ScrollView 
             style={styles.scrollView}
             contentContainerStyle={styles.scrollContent}
             showsVerticalScrollIndicator={false}
             keyboardShouldPersistTaps="handled"
           >
             {/* Instructions */}
             <Text style={styles.instructions}>
               {initialData 
                 ? 'Update receipt details below'
                 : 'Enter basic receipt information to get started'
               }
             </Text>
             
             {/* Receipt visual representation */}
             <View style={[styles.receiptContainer, { maxWidth: Math.min(screenWidth - 40, 400) }]}>
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
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={[styles.fieldInput, styles.dateInput]}
                      value={formatDateForDisplay(selectedDate)}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="#999"
                      editable={false}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.calendarButton,
                        calendarPressed && styles.calendarButtonPressed
                      ]}
                      onPress={handleDateSelect}
                      onPressIn={() => setCalendarPressed(true)}
                      onPressOut={() => setCalendarPressed(false)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
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

            
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Native Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          visible={showDatePicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleDatePickerDismiss}
        >
          <View style={styles.iosDatePickerContainer}>
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity onPress={handleDatePickerDismiss}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={handleDatePickerDismiss}>
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(2020, 0, 1)}
              style={styles.iosDatePicker}
            />
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: padding.xl,
    paddingVertical: padding.lg,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: height.button,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  nextButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    minHeight: '100%',
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
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignSelf: 'center',
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
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 52,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  calendarButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  calendarButtonPressed: {
    backgroundColor: '#E1F0FF',
    transform: [{ scale: 0.95 }],
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
    maxWidth: 400,
  },
  // iOS Date Picker Styles
  iosDatePickerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: 60,
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#999',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  iosDatePicker: {
    backgroundColor: 'white',
    marginTop: 20,
  },
});

export default AddReceiptOverlay;