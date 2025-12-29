import { useState } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { segmentImage, APISegmentationResponse } from '@/services/fruitApi';
import { toast } from 'sonner';

interface SegmentationViewProps {
  segmentation: APISegmentationResponse | null;
  enabled: boolean;
  onToggle: () => void;
  originalImage: string | null;
}

export function SegmentationView({ 
  segmentation, 
  enabled, 
  onToggle,
  originalImage 
}: SegmentationViewProps) {
  const [k, setK] = useState(4);
  const [colorSpace, setColorSpace] = useState<'RGB' | 'HSV' | 'LAB'>('RGB');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSegmentation, setLocalSegmentation] = useState<APISegmentationResponse | null>(null);

  const currentSegmentation = localSegmentation || segmentation;

  const handleReprocess = async () => {
    if (!originalImage) {
      toast.error('Pas d\'image à segmenter');
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await segmentImage(originalImage, k, colorSpace);
      setLocalSegmentation(result);
      toast.success(`Segmentation K=${k} (${colorSpace}) terminée`);
    } catch (error) {
      toast.error('Erreur de segmentation');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Segmentation K-means
          </div>
          <Button 
            variant={enabled ? 'secondary' : 'outline'} 
            size="sm" 
            onClick={onToggle}
          >
            {enabled ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            {enabled ? 'Activé' : 'Désactivé'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {enabled && (
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Clusters (K): {k}</label>
              <Slider
                value={[k]}
                onValueChange={([value]) => setK(value)}
                min={3}
                max={8}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Espace couleur</label>
              <Select value={colorSpace} onValueChange={(v) => setColorSpace(v as 'RGB' | 'HSV' | 'LAB')}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RGB">RGB</SelectItem>
                  <SelectItem value="HSV">HSV</SelectItem>
                  <SelectItem value="LAB">LAB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleReprocess} 
            disabled={!originalImage || isProcessing}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {isProcessing ? 'Traitement...' : 'Appliquer la segmentation'}
          </Button>

          {/* Segmentation result */}
          {currentSegmentation && (
            <div className="space-y-3">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={currentSegmentation.segmented_image} 
                  alt="Segmented" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  K = {currentSegmentation.k}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentSegmentation.color_space}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Inertie: {currentSegmentation.inertia.toFixed(0)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Aire: {currentSegmentation.fruit_mask_area_pixels.toLocaleString()}px
                </Badge>
              </div>
              
              {/* Cluster colors */}
              <div className="flex gap-1">
                {currentSegmentation.cluster_centers.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ 
                      backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` 
                    }}
                    title={`Cluster ${i + 1}: RGB(${color.join(', ')})`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {!currentSegmentation && originalImage && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Cliquez sur "Appliquer" pour voir la segmentation
            </div>
          )}
          
          {!originalImage && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Scannez une image d'abord
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
