import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12 Pro as reference)
const baseWidth = 390;
const baseHeight = 844;

// Responsive scaling functions
export const scale = (size: number) => {
  const newSize = size * SCREEN_WIDTH / baseWidth;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const verticalScale = (size: number) => {
  const newSize = size * SCREEN_HEIGHT / baseHeight;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const moderateScale = (size: number, factor = 0.5) => {
  const newSize = size + (scale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Device type detection
export const isSmallDevice = () => SCREEN_WIDTH < 375;
export const isMediumDevice = () => SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = () => SCREEN_WIDTH >= 414;

// Responsive spacing
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Responsive font sizes
export const fontSize = {
  xs: moderateScale(12),
  sm: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(28),
};

// Responsive padding/margins
export const padding = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

// Responsive heights
export const height = {
  header: verticalScale(70),
  button: verticalScale(48),
  input: verticalScale(52),
  card: verticalScale(80),
};

// Responsive widths
export const width = {
  button: scale(120),
  card: scale(300),
  modal: Math.min(SCREEN_WIDTH - scale(40), scale(400)),
};

// Screen dimensions
export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice(),
  isMedium: isMediumDevice(),
  isLarge: isLargeDevice(),
}; 