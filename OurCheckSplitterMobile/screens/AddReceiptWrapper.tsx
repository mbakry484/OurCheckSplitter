import React, { useState } from 'react';
import { View } from 'react-native';
import AddReceiptOverlay, { BasicReceiptData } from './AddReceiptOverlay';
import AddReceiptScreen from './AddReceiptScreen';

interface AddReceiptWrapperProps {
  navigation?: any;
  route?: any;
}

const AddReceiptWrapper = ({ navigation, route }: AddReceiptWrapperProps) => {
  const isEditing = route?.params?.isEditing;
  const editingData = route?.params?.receiptData;
  
  // If we're editing, skip the overlay and go directly to AddReceiptScreen
  const [showOverlay, setShowOverlay] = useState(!isEditing);
  const [basicData, setBasicData] = useState<BasicReceiptData | null>(
    isEditing ? route?.params?.basicData : null
  );
  const [receiptId, setReceiptId] = useState<number | null>(null);

  const handleOverlayClose = () => {
    setShowOverlay(false);
    // Navigate back to the previous screen
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleOverlayNext = (data: BasicReceiptData, receiptId: number) => {
    setBasicData(data);
    setShowOverlay(false);
    // Store receiptId to pass to AddReceiptScreen
    setReceiptId(receiptId);
  };

  const handleEditBasicData = (currentData: BasicReceiptData) => {
    // Reopen overlay with current data for editing
    setBasicData(currentData);
    setShowOverlay(true);
  };

  if (showOverlay) {
    return (
      <AddReceiptOverlay
        visible={true}
        onClose={handleOverlayClose}
        onNext={handleOverlayNext}
        initialData={basicData} // Pass existing data for editing
      />
    );
  }

  // Create route params with basic data for AddReceiptScreen
  const modifiedRoute = {
    ...route,
    params: {
      ...route?.params,
      basicData,
      receiptId,
      isEditing,
      receiptData: editingData,
    },
  };

  return (
    <AddReceiptScreen 
      navigation={navigation} 
      route={modifiedRoute}
      onEditBasicData={handleEditBasicData}
    />
  );
};

export default AddReceiptWrapper;