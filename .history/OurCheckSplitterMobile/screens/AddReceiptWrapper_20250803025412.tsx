import React, { useState } from 'react';
import { View } from 'react-native';
import AddReceiptOverlay, { BasicReceiptData } from './AddReceiptOverlay';
import AddReceiptScreen from './AddReceiptScreen';

interface AddReceiptWrapperProps {
  navigation?: any;
  route?: any;
}

const AddReceiptWrapper = ({ navigation, route }: AddReceiptWrapperProps) => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [basicData, setBasicData] = useState<BasicReceiptData | null>(null);

  const handleOverlayClose = () => {
    setShowOverlay(false);
    // Navigate back to the previous screen
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleOverlayNext = (data: BasicReceiptData) => {
    setBasicData(data);
    setShowOverlay(false);
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
      />
    );
  }

  // Create route params with basic data for AddReceiptScreen
  const modifiedRoute = {
    ...route,
    params: {
      ...route?.params,
      basicData,
    },
  };

  return (
    <AddReceiptScreen 
      navigation={navigation} 
      route={modifiedRoute}
    />
  );
};

export default AddReceiptWrapper;