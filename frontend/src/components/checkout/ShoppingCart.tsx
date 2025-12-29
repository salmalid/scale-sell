import { ShoppingCart as CartIcon, Trash2, Receipt, Scale, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/types/checkout';
import { formatWeight, formatPrice } from '@/utils/weightEstimation';
import { TVA_RATE } from '@/data/fruits';

interface ShoppingCartProps {
  items: CartItem[];
  subtotal: number;
  tva: number;
  total: number;
  totalWeight: number;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function ShoppingCart({
  items,
  subtotal,
  tva,
  total,
  totalWeight,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: ShoppingCartProps) {
  return (
    <Card className="h-full flex flex-col border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-display">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-4 w-4" />
            </div>
            🛍️ Mon Panier
            {items.length > 0 && (
              <span className="ml-1 px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded-full font-bold">
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearCart} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8">
            <div className="text-7xl mb-4">🧺</div>
            <p className="text-center font-medium">Votre panier est vide</p>
            <p className="text-sm text-center mt-1">Scannez des fruits pour les ajouter</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-4 px-4">
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-card border-2 border-muted rounded-xl group hover:border-primary/30 transition-colors"
                  >
                    <span className="text-4xl">{item.fruit.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold truncate">{item.fruit.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => onRemoveItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Scale className="h-3 w-3" />
                          {formatWeight(item.weightKg)}
                        </span>
                        <span className="font-bold text-primary">
                          {formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 pt-4 border-t-2 border-dashed border-muted space-y-3">
              {/* Weight summary */}
              <div className="flex items-center justify-between text-sm bg-accent/30 px-3 py-2 rounded-xl">
                <span className="flex items-center gap-2 font-medium">
                  <Scale className="h-4 w-4" />
                  Poids total
                </span>
                <span className="font-bold">{formatWeight(totalWeight)}</span>
              </div>
              
              {/* Price breakdown */}
              <div className="space-y-2 bg-muted/30 p-3 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>TVA ({(TVA_RATE * 100).toFixed(0)}%)</span>
                  <span>{formatPrice(tva)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <Button 
                className="w-full rounded-xl shadow-lg" 
                size="lg" 
                onClick={onCheckout}
              >
                <Receipt className="h-5 w-5 mr-2" />
                Payer Maintenant 💳
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
