import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Move, Square } from 'lucide-react';

interface Position {
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface QRPosition {
  x: number;
  y: number;
  size: number;
}

interface CertificatePositionPickerProps {
  templateUrl: string;
  namePosition: Position;
  qrPosition: QRPosition;
  onNamePositionChange: (position: Position) => void;
  onQRPositionChange: (position: QRPosition) => void;
}

export const CertificatePositionPicker = ({
  templateUrl,
  namePosition,
  qrPosition,
  onNamePositionChange,
  onQRPositionChange
}: CertificatePositionPickerProps) => {
  const [mode, setMode] = useState<'name' | 'qr' | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    drawCanvas();
  }, [templateUrl, namePosition, qrPosition, imageSize]);

  const loadImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      setImageSize({
        width: img.width * scale,
        height: img.height * scale
      });
    };
    img.src = templateUrl;
  };

  useEffect(() => {
    if (templateUrl) {
      loadImage();
    }
  }, [templateUrl]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || imageSize.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;

    // Draw template image
    ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);

    // Calculate scale factor for positions
    const scale = imageSize.width / img.width;

    // Draw name position marker
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Crosshair for name position
    const nameX = namePosition.x * scale;
    const nameY = namePosition.y * scale;
    ctx.beginPath();
    ctx.moveTo(nameX - 30, nameY);
    ctx.lineTo(nameX + 30, nameY);
    ctx.moveTo(nameX, nameY - 30);
    ctx.lineTo(nameX, nameY + 30);
    ctx.stroke();
    
    // Name position circle
    ctx.beginPath();
    ctx.arc(nameX, nameY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();

    // Draw sample text
    ctx.font = `${namePosition.fontSize || 38}px ${namePosition.fontFamily || 'Arial'}`;
    ctx.fillStyle = namePosition.color || '#1a365d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sample Name', nameX, nameY);

    // Draw QR position box
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    const qrX = qrPosition.x * scale;
    const qrY = qrPosition.y * scale;
    const qrSize = qrPosition.size * scale;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    
    // QR label
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('QR Code', qrX, qrY - 5);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mode) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to actual image coordinates
    const scale = img.width / imageSize.width;
    const actualX = Math.round(x * scale);
    const actualY = Math.round(y * scale);

    if (mode === 'name') {
      onNamePositionChange({
        ...namePosition,
        x: actualX,
        y: actualY
      });
      setMode(null);
    } else if (mode === 'qr') {
      onQRPositionChange({
        ...qrPosition,
        x: actualX,
        y: actualY
      });
      setMode(null);
    }
  };

  const applyPreset = (preset: string) => {
    const img = imageRef.current;
    if (!img) return;

    switch (preset) {
      case 'center':
        onNamePositionChange({
          ...namePosition,
          x: Math.round(img.width / 2),
          y: Math.round(img.height / 2)
        });
        break;
      case 'top-center':
        onNamePositionChange({
          ...namePosition,
          x: Math.round(img.width / 2),
          y: Math.round(img.height * 0.3)
        });
        break;
      case 'bottom-center':
        onNamePositionChange({
          ...namePosition,
          x: Math.round(img.width / 2),
          y: Math.round(img.height * 0.7)
        });
        break;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Position Configuration</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Click on the template image to set name and QR code positions
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('name')}
            >
              <Move className="mr-2 h-4 w-4" />
              Set Name Position
            </Button>
            <Button
              type="button"
              variant={mode === 'qr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('qr')}
            >
              <Square className="mr-2 h-4 w-4" />
              Set QR Position
            </Button>
          </div>

          {mode && (
            <div className="text-sm text-primary font-medium">
              {mode === 'name' ? 'Click on the template to place the name text' : 'Click on the template to place the QR code'}
            </div>
          )}

          <div className="border rounded-lg p-2 bg-muted/50 overflow-auto max-h-[500px]">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`max-w-full ${mode ? 'cursor-crosshair' : 'cursor-default'}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-3">
              <Label className="font-semibold">Name Text Configuration</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X Position</Label>
                  <Input
                    type="number"
                    value={namePosition.x}
                    onChange={(e) => onNamePositionChange({ ...namePosition, x: Number(e.target.value) })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Position</Label>
                  <Input
                    type="number"
                    value={namePosition.y}
                    onChange={(e) => onNamePositionChange({ ...namePosition, y: Number(e.target.value) })}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Font Size</Label>
                <Input
                  type="number"
                  value={namePosition.fontSize || 38}
                  onChange={(e) => onNamePositionChange({ ...namePosition, fontSize: Number(e.target.value) })}
                  className="h-8"
                />
              </div>

              <div>
                <Label className="text-xs">Font Family</Label>
                <Input
                  value={namePosition.fontFamily || 'Arial'}
                  onChange={(e) => onNamePositionChange({ ...namePosition, fontFamily: e.target.value })}
                  className="h-8"
                  placeholder="Arial, Georgia, etc."
                />
              </div>

              <div>
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={namePosition.color || '#1a365d'}
                  onChange={(e) => onNamePositionChange({ ...namePosition, color: e.target.value })}
                  className="h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Quick Presets</Label>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => applyPreset('center')}>Center</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyPreset('top-center')}>Top</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyPreset('bottom-center')}>Bottom</Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">QR Code Configuration</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X Position</Label>
                  <Input
                    type="number"
                    value={qrPosition.x}
                    onChange={(e) => onQRPositionChange({ ...qrPosition, x: Number(e.target.value) })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Position</Label>
                  <Input
                    type="number"
                    value={qrPosition.y}
                    onChange={(e) => onQRPositionChange({ ...qrPosition, y: Number(e.target.value) })}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">QR Code Size</Label>
                <Input
                  type="number"
                  value={qrPosition.size}
                  onChange={(e) => onQRPositionChange({ ...qrPosition, size: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
