import { useRef, useState } from 'react';
import { Camera, Upload, X, RotateCcw, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCamera } from '@/hooks/useCamera';

interface CameraZoneProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export function CameraZone({ onCapture, isProcessing }: CameraZoneProps) {
  const {
    videoRef,
    canvasRef,
    isStreaming,
    capturedImage,
    error,
    startCamera,
    stopCamera,
    captureFrame,
    clearCapture,
    setCapturedImage,
  } = useCamera();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');

  const handleCapture = () => {
    const image = captureFrame();
    if (image) {
      onCapture(image);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setCapturedImage(imageData);
        onCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    clearCapture();
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
            <Scan className="h-4 w-4" />
          </div>
          📸 Zone de Scan
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={mode === 'camera' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('camera')}
            className="rounded-full"
          >
            <Camera className="h-4 w-4 mr-1" />
            Webcam
          </Button>
          <Button
            variant={mode === 'upload' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('upload');
              stopCamera();
            }}
            className="rounded-full"
          >
            <Upload className="h-4 w-4 mr-1" />
            Photo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden">
          {capturedImage ? (
            <>
              <img
                src={capturedImage}
                alt="Captured fruit"
                className="w-full h-full object-cover"
              />
              {/* Scan overlay with fruit colors */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 border-4 border-secondary rounded-2xl border-dashed animate-pulse" />
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-3 right-3 rounded-full shadow-lg"
                onClick={handleRetake}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reprendre
              </Button>
            </>
          ) : mode === 'camera' ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {!isStreaming && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-primary/5 to-secondary/5">
                  <div className="text-6xl animate-bounce">🍊</div>
                  <Button onClick={startCamera} size="lg" className="rounded-full shadow-lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Démarrer la caméra
                  </Button>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <div className="text-center p-6">
                    <div className="text-5xl mb-3">😅</div>
                    <p className="text-sm text-muted-foreground mb-3">{error}</p>
                    <Button
                      variant="secondary"
                      onClick={() => setMode('upload')}
                      className="rounded-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Utiliser une photo
                    </Button>
                  </div>
                </div>
              )}
              {isStreaming && (
                <>
                  {/* Colorful scan frame */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-3/4 relative">
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-fruit-red rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-fruit-orange rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-fruit-green rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-fruit-yellow rounded-br-2xl" />
                    </div>
                  </div>
                  <Button
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-xl px-8"
                    size="lg"
                    onClick={handleCapture}
                    disabled={isProcessing}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Scanner 🔍
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-primary/5 to-secondary/5">
              <div className="text-6xl">🖼️</div>
              <p className="text-muted-foreground text-sm font-medium">
                Téléchargez une photo de fruit
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                className="rounded-full shadow-lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Choisir une image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="mt-3 px-3 py-2 bg-accent/30 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">
            🎯 Placez le fruit au centre pour une meilleure précision
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
