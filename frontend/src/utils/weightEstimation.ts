import { FruitData, ScanResult } from '@/types/checkout';

// Constants for size estimation
const REFERENCE_DISTANCE_CM = 40; // Assumed distance from camera
const SENSOR_WIDTH_MM = 6.17; // Typical smartphone sensor
const FOCAL_LENGTH_MM = 4.0; // Typical smartphone focal length

/**
 * Estimate weight based on detected fruit area in image
 * This is a simplified estimation - in production you'd use more sophisticated CV
 */
export function estimateWeight(
  fruit: FruitData,
  imageWidth: number,
  imageHeight: number,
  boundingBoxArea: number // Area of fruit in pixels
): { weightKg: number; size: 'small' | 'medium' | 'large' } {
  const imageArea = imageWidth * imageHeight;
  const fruitRatio = boundingBoxArea / imageArea;
  
  // Estimate real-world size based on ratio
  // This is simplified - real implementation would use reference objects
  const estimatedDiameterCm = Math.sqrt(fruitRatio) * REFERENCE_DISTANCE_CM * 0.8;
  
  // Estimate volume assuming spherical/ellipsoidal shape
  const radiusCm = estimatedDiameterCm / 2;
  const volumeCm3 = (4 / 3) * Math.PI * Math.pow(radiusCm, 3) * 0.7; // 0.7 correction factor
  
  // Calculate weight using density
  const weightGrams = volumeCm3 * fruit.avgDensity;
  
  // Determine size category
  let size: 'small' | 'medium' | 'large';
  if (weightGrams < fruit.avgWeight * 0.7) {
    size = 'small';
  } else if (weightGrams > fruit.avgWeight * 1.3) {
    size = 'large';
  } else {
    size = 'medium';
  }
  
  // Apply size-based adjustments
  const sizeMultipliers = { small: 0.7, medium: 1.0, large: 1.4 };
  const adjustedWeight = fruit.avgWeight * sizeMultipliers[size];
  
  return {
    weightKg: adjustedWeight / 1000,
    size,
  };
}

/**
 * Simulate fruit detection with random bounding box
 * In production, this would be replaced with actual CV model
 */
export function simulateFruitDetection(
  fruit: FruitData,
  imageWidth: number = 640,
  imageHeight: number = 480
): ScanResult {
  // Simulate random bounding box (20-40% of image)
  const boxRatio = 0.2 + Math.random() * 0.2;
  const boxSize = Math.sqrt(boxRatio * imageWidth * imageHeight);
  
  const boundingBox = {
    x: (imageWidth - boxSize) / 2,
    y: (imageHeight - boxSize) / 2,
    width: boxSize,
    height: boxSize * (0.8 + Math.random() * 0.4),
  };
  
  const boundingBoxArea = boundingBox.width * boundingBox.height;
  const { weightKg, size } = estimateWeight(fruit, imageWidth, imageHeight, boundingBoxArea);
  
  // Simulate confidence score (75-99%)
  const confidence = 0.75 + Math.random() * 0.24;
  
  return {
    fruit,
    confidence,
    estimatedWeightKg: weightKg,
    estimatedSize: size,
    boundingBox,
  };
}

/**
 * Format weight for display
 */
export function formatWeight(kg: number): string {
  if (kg >= 1) {
    return `${kg.toFixed(2)} kg`;
  }
  return `${(kg * 1000).toFixed(0)} g`;
}

/**
 * Format price for Moroccan Dirhams
 */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} DH`;
}
