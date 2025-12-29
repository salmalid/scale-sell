import { Scale, TrendingUp, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScanResult } from '@/types/checkout';
import { formatWeight, formatPrice } from '@/utils/weightEstimation';
import { useState, useEffect } from 'react';

interface RecognitionResultProps {
  result: ScanResult | null;
  isProcessing: boolean;
  onAddToCart: (weightKg: number) => void;
}

export function RecognitionResult({ result, isProcessing, onAddToCart }: RecognitionResultProps) {
  const [adjustedWeight, setAdjustedWeight] = useState<number>(0);

  // Update adjusted weight when result changes
  useEffect(() => {
    if (result?.estimatedWeightKg) {
      setAdjustedWeight(result.estimatedWeightKg);
    }
  }, [result?.estimatedWeightKg]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-primary text-primary-foreground';
    if (confidence >= 0.7) return 'bg-secondary text-secondary-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getSizeLabel = (size: 'small' | 'medium' | 'large') => {
    const labels = { small: '🔹 Petit', medium: '🔸 Moyen', large: '🔶 Grand' };
    return labels[size];
  };

  if (isProcessing) {
    return (
      <Card className="border-2 border-secondary/20 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-secondary/10 to-accent/10">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Sparkles className="h-5 w-5 text-secondary animate-spin" />
            🔍 Analyse en cours...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <div className="text-7xl animate-bounce">🍎</div>
            </div>
            <div className="text-center text-muted-foreground">
              <p className="font-medium">Reconnaissance du fruit...</p>
              <p className="text-sm">Notre IA analyse votre image</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-fresh animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result || !result.fruit) {
    return (
      <Card className="border-2 border-muted shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-display text-muted-foreground">
            <Scale className="h-5 w-5" />
            🎯 Reconnaissance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-8xl mb-4">🍇</div>
            <p className="font-medium text-muted-foreground">Prêt à scanner</p>
            <p className="text-sm text-muted-foreground mt-1">
              Capturez une image ou sélectionnez un fruit
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPrice = adjustedWeight * result.fruit.pricePerKg;

  return (
    <Card className="border-2 border-primary/30 shadow-xl overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
          ✅ Fruit Reconnu!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fruit identification - Hero section */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border-2 border-primary/20">
          <div className="text-6xl animate-bounce">{result.fruit.icon}</div>
          <div className="flex-1">
            <h3 className="font-bold text-2xl font-display">{result.fruit.name}</h3>
            <p className="text-sm text-muted-foreground">{result.fruit.category}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={`${getConfidenceColor(result.confidence)} rounded-full`}>
                {(result.confidence * 100).toFixed(0)}% confiance
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {getSizeLabel(result.estimatedSize)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Weight estimation */}
        <div className="space-y-3 p-4 bg-accent/20 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Poids estimé
            </span>
            <span className="text-2xl font-bold text-primary font-display">
              {formatWeight(adjustedWeight)}
            </span>
          </div>
          
          <div className="space-y-2">
            <Slider
              value={[adjustedWeight * 1000]}
              onValueChange={([value]) => setAdjustedWeight(value / 1000)}
              min={50}
              max={2000}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>50g</span>
              <span>↔️ Glissez pour ajuster</span>
              <span>2kg</span>
            </div>
          </div>
        </div>

        {/* Pricing - Highlight section */}
        <div className="p-4 bg-gradient-to-r from-secondary/10 to-accent/20 rounded-2xl border-2 border-secondary/20 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix au kg</span>
            <span className="font-bold">{formatPrice(result.fruit.pricePerKg)}/kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total</span>
            <span className="text-3xl font-bold text-primary font-display">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {/* Size estimation note */}
        {result.confidence < 0.85 && (
          <div className="flex items-start gap-3 p-3 bg-secondary/10 rounded-xl border border-secondary/30">
            <AlertTriangle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Confiance moyenne.</span> Vérifiez le fruit et ajustez le poids si nécessaire.
            </p>
          </div>
        )}

        {/* Add to cart button */}
        <Button 
          className="w-full rounded-xl shadow-lg text-lg py-6" 
          size="lg"
          onClick={() => onAddToCart(adjustedWeight)}
        >
          <TrendingUp className="h-5 w-5 mr-2" />
          Ajouter au panier • {formatPrice(totalPrice)} 🛒
        </Button>
      </CardContent>
    </Card>
  );
}
