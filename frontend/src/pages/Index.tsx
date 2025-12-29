import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/checkout/Header';
import { CameraZone } from '@/components/checkout/CameraZone';
import { RecognitionResult } from '@/components/checkout/RecognitionResult';
import { ShoppingCart } from '@/components/checkout/ShoppingCart';
import { InvoiceDialog } from '@/components/checkout/InvoiceDialog';
import { FruitSelector } from '@/components/checkout/FruitSelector';
import { ApiConfig } from '@/components/checkout/ApiConfig';
import { SegmentationView } from '@/components/checkout/SegmentationView';
import { useCart } from '@/hooks/useCart';
import { fruitDatabase } from '@/data/fruits';
import { simulateFruitDetection } from '@/utils/weightEstimation';
import { ScanResult, FruitData, Invoice } from '@/types/checkout';
import { 
  classifyFruit, 
  segmentImage,
  apiResponseToScanResult, 
  checkAPIHealth,
  APISegmentationResponse
} from '@/services/fruitApi';

export default function Index() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [segmentationResult, setSegmentationResult] = useState<APISegmentationResponse | null>(null);
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const {
    items,
    addItem,
    removeItem,
    clearCart,
    subtotal,
    tva,
    total,
    totalWeight,
    generateInvoice,
  } = useCart();

  // Check API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkAPIHealth();
      setApiConnected(connected);
      if (connected) {
        toast.success('API connectée! 🚀', {
          description: 'Utilisation du modèle de reconnaissance réel',
        });
      }
    };
    checkConnection();
  }, []);

  const handleCapture = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setScanResult(null);
    setSegmentationResult(null);
    setCurrentImage(imageData);

    try {
      if (apiConnected) {
        // Use real API
        const response = await classifyFruit(imageData);
        const result = apiResponseToScanResult(response);
        setScanResult(result);
        
        // Optionally get segmentation
        if (showSegmentation) {
          try {
            const segResult = await segmentImage(imageData, 4, 'RGB');
            setSegmentationResult(segResult);
          } catch (segError) {
            console.warn('Segmentation failed:', segError);
          }
        }
        
        toast.success(`${result.fruit?.icon || '🍎'} ${result.fruit?.name} détecté!`, {
          description: `Confiance: ${(result.confidence * 100).toFixed(0)}%${response.mock ? ' (mode test)' : ''}`,
        });
      } else {
        // Fallback to simulation
        await new Promise(resolve => setTimeout(resolve, 1500));
        const randomFruit = fruitDatabase[Math.floor(Math.random() * fruitDatabase.length)];
        const result = simulateFruitDetection(randomFruit);
        setScanResult(result);
        
        toast.success(`${randomFruit.icon} ${randomFruit.name} détecté!`, {
          description: `Confiance: ${(result.confidence * 100).toFixed(0)}% (simulation)`,
        });
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Erreur de reconnaissance', {
        description: 'Utilisation du mode simulation',
      });
      
      // Fallback to simulation
      const randomFruit = fruitDatabase[Math.floor(Math.random() * fruitDatabase.length)];
      const result = simulateFruitDetection(randomFruit);
      setScanResult(result);
    } finally {
      setIsProcessing(false);
    }
  }, [apiConnected, showSegmentation]);

  const handleManualSelect = useCallback((fruit: FruitData) => {
    const result = simulateFruitDetection(fruit);
    setScanResult(result);
    setSegmentationResult(null);
    toast.info(`${fruit.icon} ${fruit.name} sélectionné`, {
      description: 'Ajustez le poids estimé si nécessaire',
    });
  }, []);

  const handleAddToCart = useCallback((weightKg: number) => {
    if (!scanResult?.fruit) return;
    
    addItem(scanResult.fruit, weightKg, scanResult.estimatedSize);
    toast.success('Ajouté au panier! 🛒', {
      description: `${scanResult.fruit.icon} ${scanResult.fruit.name} - ${(weightKg * 1000).toFixed(0)}g`,
    });
    setScanResult(null);
    setSegmentationResult(null);
    setCurrentImage(null);
  }, [scanResult, addItem]);

  const handleCheckout = useCallback(() => {
    const inv = generateInvoice();
    setInvoice(inv);
    setShowInvoice(true);
  }, [generateInvoice]);

  const handleCloseInvoice = useCallback(() => {
    setShowInvoice(false);
    clearCart();
    setScanResult(null);
    setSegmentationResult(null);
    setCurrentImage(null);
    toast.success('Transaction terminée! 🎉', {
      description: 'Merci pour votre achat 🙏',
    });
  }, [clearCart]);

  const handleApiStatusChange = useCallback((connected: boolean) => {
    setApiConnected(connected);
  }, []);

  const handleSegmentationToggle = useCallback(async () => {
    const newValue = !showSegmentation;
    setShowSegmentation(newValue);
    
    // If enabling and we have an image, run segmentation
    if (newValue && currentImage && !segmentationResult) {
      try {
        const segResult = await segmentImage(currentImage, 4, 'RGB');
        setSegmentationResult(segResult);
      } catch (error) {
        console.warn('Segmentation failed:', error);
        toast.error('Segmentation non disponible');
      }
    }
  }, [showSegmentation, currentImage, segmentationResult]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Welcome banner with API status */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/20 rounded-2xl border-2 border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold font-display">Bienvenue! 👋</h2>
              <p className="text-sm text-muted-foreground">
                {apiConnected 
                  ? '✅ API connectée - Reconnaissance IA réelle' 
                  : '⚠️ Mode simulation - Configurez l\'API pour la reconnaissance réelle'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-4xl">🍎🍊🍋🍇🥭</div>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <ApiConfig onStatusChange={handleApiStatusChange} />

        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Left column - Camera & Manual selection */}
          <div className="space-y-6">
            <CameraZone onCapture={handleCapture} isProcessing={isProcessing} />
            <FruitSelector onSelect={handleManualSelect} />
          </div>

          {/* Center column - Recognition result & Segmentation */}
          <div className="space-y-6">
            <RecognitionResult
              result={scanResult}
              isProcessing={isProcessing}
              onAddToCart={handleAddToCart}
            />
            
            {/* Segmentation view */}
            {apiConnected && (
              <SegmentationView
                segmentation={segmentationResult}
                enabled={showSegmentation}
                onToggle={handleSegmentationToggle}
                originalImage={currentImage}
              />
            )}
          </div>

          {/* Right column - Shopping cart */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ShoppingCart
              items={items}
              subtotal={subtotal}
              tva={tva}
              total={total}
              totalWeight={totalWeight}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t bg-card">
        <p>🛒 Caisse Fraîche • Propulsé par IA • Made in Morocco 🇲🇦</p>
      </footer>

      <InvoiceDialog
        invoice={invoice}
        open={showInvoice}
        onClose={handleCloseInvoice}
      />
    </div>
  );
}
