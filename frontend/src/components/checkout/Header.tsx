import { ShoppingCart, Scale, Sparkles, Apple } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-secondary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                🍎 Caisse Fraîche
              </h1>
              <p className="text-sm text-primary-foreground/80">
                Reconnaissance IA • Prix au kilo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-full">
              <Scale className="h-4 w-4" />
              <span className="text-sm font-medium">Prix au kg</span>
            </div>
            <div className="text-3xl">🇲🇦</div>
          </div>
        </div>
      </div>
      {/* Decorative fruit strip */}
      <div className="h-2 gradient-fresh" />
    </header>
  );
}
