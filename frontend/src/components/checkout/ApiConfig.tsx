import { useState, useEffect } from 'react';
import { Settings, Wifi, WifiOff, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { checkAPIHealth } from '@/services/fruitApi';
import { toast } from 'sonner';

interface ApiConfigProps {
  onStatusChange: (connected: boolean) => void;
}

// Store API URL in localStorage
const API_URL_KEY = 'fruit_api_url';

export function getApiUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  return localStorage.getItem(API_URL_KEY) || import.meta.env.VITE_FRUIT_API_URL || 'http://localhost:8000';
}

export function setApiUrl(url: string): void {
  localStorage.setItem(API_URL_KEY, url);
  // Update the global for immediate effect
  (window as any).__FRUIT_API_URL__ = url;
}

export function ApiConfig({ onStatusChange }: ApiConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await checkAPIHealth();
      setIsConnected(connected);
      onStatusChange(connected);
      
      if (connected) {
        toast.success('API connectée!');
      } else {
        toast.error('API non disponible');
      }
    } catch {
      setIsConnected(false);
      onStatusChange(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleSaveUrl = () => {
    setApiUrl(apiUrl);
    toast.info('URL sauvegardée');
    checkConnection();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="border border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration API
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="default" className="bg-primary/80 text-xs">
                    <Wifi className="h-3 w-3 mr-1" />
                    Connecté
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Mode Simulation
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL de l'API Python</label>
              <div className="flex gap-2">
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrlState(e.target.value)}
                  placeholder="https://votre-api.onrender.com"
                  className="flex-1"
                />
                <Button onClick={handleSaveUrl} variant="secondary">
                  Sauvegarder
                </Button>
                <Button onClick={checkConnection} variant="outline" disabled={isChecking}>
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Déployez l'API sur Render ou Railway, puis entrez l'URL ici
              </p>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Besoin de déployer l'API?</p>
                <p className="text-xs text-muted-foreground">
                  Consultez le dossier python-api/ pour les instructions
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://github.com/salmalid/fruit-recognition" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
