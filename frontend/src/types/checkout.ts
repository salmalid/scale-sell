export interface FruitData {
  id: string;
  name: string;
  pricePerKg: number;
  category: string;
  avgDensity: number; // g/cm³
  avgWeight: number; // typical weight in grams
  icon: string;
}

export interface CartItem {
  fruit: FruitData;
  weightKg: number;
  estimatedSize: 'small' | 'medium' | 'large';
  unitPrice: number;
  totalPrice: number;
  timestamp: Date;
}

export interface ScanResult {
  fruit: FruitData | null;
  confidence: number;
  estimatedWeightKg: number;
  estimatedSize: 'small' | 'medium' | 'large';
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Invoice {
  id: string;
  items: CartItem[];
  subtotal: number;
  tva: number;
  tvaRate: number;
  total: number;
  timestamp: Date;
}
