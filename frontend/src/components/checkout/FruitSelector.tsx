import { Search, Apple } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fruitDatabase, searchFruits } from '@/data/fruits';
import { FruitData } from '@/types/checkout';
import { formatPrice } from '@/utils/weightEstimation';

interface FruitSelectorProps {
  onSelect: (fruit: FruitData) => void;
}

const categoryEmojis: Record<string, string> = {
  'Agrumes': '🍊',
  'Fruits tropicaux': '🥭',
  'Baies': '🍓',
  'Fruits à noyau': '🍑',
  'Fruits communs': '🍎',
  'Melons': '🍈',
};

export function FruitSelector({ onSelect }: FruitSelectorProps) {
  const [query, setQuery] = useState('');
  const fruits = query ? searchFruits(query) : fruitDatabase;

  // Group by category
  const grouped = fruits.reduce((acc, fruit) => {
    if (!acc[fruit.category]) {
      acc[fruit.category] = [];
    }
    acc[fruit.category].push(fruit);
    return acc;
  }, {} as Record<string, FruitData[]>);

  return (
    <Card className="border-2 border-secondary/20 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-secondary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <div className="p-1.5 rounded-lg bg-secondary text-secondary-foreground">
            <Apple className="h-4 w-4" />
          </div>
          🛒 Sélection Manuelle
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fruit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 rounded-full bg-background border-2 border-muted focus:border-primary"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] -mx-4 px-4">
          {Object.entries(grouped).map(([category, categoryFruits]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
                <span>{categoryEmojis[category] || '🍇'}</span>
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {categoryFruits.map((fruit) => (
                  <button
                    key={fruit.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border-2 border-transparent hover:border-primary hover:shadow-md transition-all text-left group"
                    onClick={() => onSelect(fruit)}
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{fruit.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{fruit.name}</p>
                      <p className="text-xs text-primary font-bold">
                        {formatPrice(fruit.pricePerKg)}/kg
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
