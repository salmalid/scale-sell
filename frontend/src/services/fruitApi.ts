/**
 * Fruit Recognition API Service
 * Connects to the Python FastAPI backend for classification, segmentation, and pricing
 */

import { FruitData, ScanResult } from '@/types/checkout';

// Configuration - Get URL from localStorage or env
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fruit_api_url') || import.meta.env.VITE_FRUIT_API_URL || 'http://localhost:8000';
  }
  return import.meta.env.VITE_FRUIT_API_URL || 'http://localhost:8000';
}

const getApiUrl = () => getApiBaseUrl();

export interface APIClassificationResponse {
  fruit_name: string;
  confidence: number;
  class_index: number;
  price_per_kg: number;
  weight: {
    weight_kg: number;
    weight_grams: number;
    estimated_diameter_cm: number;
    size_category: 'small' | 'medium' | 'large';
    shape: string;
    density: number;
    form_factor: number;
  };
  total_price: number;
  contour: {
    bounding_box: { x: number; y: number; width: number; height: number };
    center: { x: number; y: number };
    radius: number;
    area_pixels: number;
    circularity: number;
  } | null;
  mock: boolean;
}

export interface APISegmentationResponse {
  segmented_image: string;
  k: number;
  color_space: string;
  inertia: number;
  cluster_centers: number[][];
  fruit_mask_area_pixels: number;
}

export interface APIFruitInfo {
  name: string;
  price_per_kg: number;
  density: number;
  dimensions: {
    shape?: string;
    avg_diameter_cm?: number;
    avg_weight_grams?: number;
    size_range?: number[];
    form_factor?: number;
  };
}

/**
 * Convert image file/blob to base64
 */
export async function imageToBase64(image: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(image);
  });
}

/**
 * Convert canvas to base64
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Check if API is available
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiUrl()}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get all available fruits from API
 */
export async function fetchAllFruits(): Promise<APIFruitInfo[]> {
  const response = await fetch(`${getApiUrl()}/fruits`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch fruits: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Classify fruit from base64 image
 */
export async function classifyFruit(
  imageBase64: string,
  pixelsPerCm: number = 50.0
): Promise<APIClassificationResponse> {
  const response = await fetch(`${getApiUrl()}/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      pixels_per_cm: pixelsPerCm,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Classification failed: ${error}`);
  }
  
  return response.json();
}

/**
 * Apply K-means segmentation to image
 */
export async function segmentImage(
  imageBase64: string,
  k: number = 4,
  colorSpace: 'RGB' | 'HSV' | 'LAB' = 'RGB'
): Promise<APISegmentationResponse> {
  const response = await fetch(`${getApiUrl()}/segment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      k: k,
      color_space: colorSpace,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Segmentation failed: ${error}`);
  }
  
  return response.json();
}

/**
 * Convert API response to local FruitData format
 */
export function apiResponseToFruitData(response: APIClassificationResponse): FruitData {
  // Parse fruit name to get base name and icon
  const baseName = response.fruit_name.split(' ')[0];
  const iconMap: Record<string, string> = {
    'Apple': '🍎',
    'Banana': '🍌',
    'Orange': '🍊',
    'Lemon': '🍋',
    'Strawberry': '🍓',
    'Grape': '🍇',
    'Watermelon': '🍉',
    'Peach': '🍑',
    'Pear': '🍐',
    'Mango': '🥭',
    'Pineapple': '🍍',
    'Coconut': '🥥',
    'Avocado': '🥑',
    'Tomato': '🍅',
    'Carrot': '🥕',
    'Cherry': '🍒',
    'Blackberry': '🫐',
    'Blueberry': '🫐',
    'Cantaloupe': '🍈',
    'Cucumber': '🥒',
    'Pepper': '🫑',
    'Onion': '🧅',
    'Potato': '🥔',
    'Beans': '🫘',
    'Cabbage': '🥬',
    'Cauliflower': '🥦',
    'Beetroot': '🫒',
    'Cactus': '🌵',
  };
  
  return {
    id: response.fruit_name.toLowerCase().replace(/\s+/g, '_'),
    name: response.fruit_name,
    pricePerKg: response.price_per_kg,
    category: baseName,
    avgDensity: response.weight.density,
    avgWeight: response.weight.weight_grams,
    icon: iconMap[baseName] || '🍎',
  };
}

/**
 * Convert API response to ScanResult
 */
export function apiResponseToScanResult(response: APIClassificationResponse): ScanResult {
  const fruit = apiResponseToFruitData(response);
  
  return {
    fruit,
    confidence: response.confidence / 100,
    estimatedWeightKg: response.weight.weight_kg,
    estimatedSize: response.weight.size_category,
    boundingBox: response.contour?.bounding_box,
  };
}

/**
 * Convert API fruit info to local format
 */
export function apiFruitToLocal(info: APIFruitInfo): FruitData {
  const baseName = info.name.split(' ')[0];
  const iconMap: Record<string, string> = {
    'Apple': '🍎', 'Banana': '🍌', 'Orange': '🍊', 'Lemon': '🍋',
    'Strawberry': '🍓', 'Grape': '🍇', 'Cherry': '🍒', 'Mango': '🥭',
    'Avocado': '🥑', 'Tomato': '🍅', 'Carrot': '🥕',
  };
  
  return {
    id: info.name.toLowerCase().replace(/\s+/g, '_'),
    name: info.name,
    pricePerKg: info.price_per_kg,
    category: baseName,
    avgDensity: info.density,
    avgWeight: info.dimensions.avg_weight_grams || 150,
    icon: iconMap[baseName] || '🍎',
  };
}
