import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Move, Square } from 'lucide-react';
import { fitWrappedText, normalizeNamePosition, type NamePosition } from '@/utils/certificateUtils';

interface QRPosition {
  x: number;
  y: number;
  size: number;
}

interface CertificatePositionPickerProps {
  templateUrl: string;
  namePosition: NamePosition;
  qrPosition: QRPosition;
  onNamePositionChange: (position: NamePosition) => void;
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
  const [sampleText, setSampleText] = useState('Sample Name');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateUrl, namePosition, qrPosition, imageSize, sampleText]);

  const loadImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      setImageSize({ width: img.width * scale, height: img.height * scale });

      // Auto-upgrade legacy point-based namePosition to box on first load
      if (!namePosition.width || !namePosition.height) {
        const box = normalizeNamePosition(namePosition, img.width, img.height);
        onNamePositionChange({ ...namePosition, ...box });
      }
    };
    img.src = templateUrl;
  };

  useEffect(() => {
    if (templateUrl) loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateUrl]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || imageSize.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageSize.width;
    canvas.height = imageSize.height;
    ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);

    const scale = imageSize.width / img.width;
    const box = normalizeNamePosition(namePosition, img.width, img.height);

    // Draw name bounding box (dashed blue)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(box.x * scale, box.y * scale, box.width * scale, box.height * scale);

    // Name label
    ctx.setLineDash([]);
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Name', box.x * scale, box.y * scale - 4);

    // Draw wrapped sample text inside the box (scaled)
    const scaledFont = Math.max(6, box.fontSize * scale);
    const measure = { measureText: (s: string) => ctx.measureText(s), font: '' as string };
    const fit = fitWrappedText(
      { ...measure, get font() { return ctx.font; }, set font(v: string) { ctx.font = v; } } as any,
      sampleText,
      box.width * scale,
      box.height * scale,
      box.fontFamily,
      scaledFont,
      box.autoShrink
    );
    ctx.font = `bold ${fit.fontSize}px ${box.fontFamily}`;
    ctx.fillStyle = box.color;
    const totalH = fit.lines.length * fit.lineHeight;
    let yStart: number;
    if (box.verticalAlign === 'top') yStart = box.y * scale + fit.lineHeight / 2;
    else if (box.verticalAlign === 'bottom') yStart = box.y * scale + box.height * scale - totalH + fit.lineHeight / 2;
    else yStart = box.y * scale + (box.height * scale - totalH) / 2 + fit.lineHeight / 2;
    let xAnchor: number;
    if (box.align === 'left') { ctx.textAlign = 'left'; xAnchor = box.x * scale; }
    else if (box.align === 'right') { ctx.textAlign = 'right'; xAnchor = box.x * scale + box.width * scale; }
    else { ctx.textAlign = 'center'; xAnchor = box.x * scale + box.width * scale / 2; }
    ctx.textBaseline = 'middle';
    fit.lines.forEach((line, i) => ctx.fillText(line, xAnchor, yStart + i * fit.lineHeight));

    // Draw QR position box
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    const qrX = qrPosition.x * scale;
    const qrY = qrPosition.y * scale;
    const qrSize = qrPosition.size * scale;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
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
    const scale = img.width / imageSize.width;
    const actualX = Math.round(x * scale);
    const actualY = Math.round(y * scale);

    if (mode === 'name') {
      const box = normalizeNamePosition(namePosition, img.width, img.height);
      // Click sets the CENTER of the name box (matches previous behavior)
      onNamePositionChange({
        ...namePosition,
        width: box.width,
        height: box.height,
        x: Math.round(actualX - box.width / 2),
        y: Math.round(actualY - box.height / 2),
      });
      setMode(null);
    } else if (mode === 'qr') {
      onQRPositionChange({ ...qrPosition, x: actualX, y: actualY });
      setMode(null);
    }
  };

  const applyPreset = (preset: string) => {
    const img = imageRef.current;
    if (!img) return;
    const box = normalizeNamePosition(namePosition, img.width, img.height);
    const w = box.width;
    const h = box.height;
    let cx = img.width / 2;
    let cy = img.height / 2;
    if (preset === 'top-center') cy = img.height * 0.3;
    if (preset === 'bottom-center') cy = img.height * 0.7;
    if (preset === 'full-band') {
      const newW = Math.round(img.width * 0.8);
      const newH = Math.round((box.fontSize) * 2.5);
      onNamePositionChange({
        ...namePosition,
        width: newW,
        height: newH,
        x: Math.round((img.width - newW) / 2),
        y: Math.round(cy - newH / 2),
      });
      return;
    }
    onNamePositionChange({
      ...namePosition,
      width: w,
      height: h,
      x: Math.round(cx - w / 2),
      y: Math.round(cy - h / 2),
    });
  };

  const patch = (p: Partial<NamePosition>) => onNamePositionChange({ ...namePosition, ...p });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Position Configuration</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Click on the template image to place the name box or QR code. Long names automatically wrap inside the name box.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant={mode === 'name' ? 'default' : 'outline'} size="sm" onClick={() => setMode('name')}>
              <Move className="mr-2 h-4 w-4" /> Place Name Box
            </Button>
            <Button type="button" variant={mode === 'qr' ? 'default' : 'outline'} size="sm" onClick={() => setMode('qr')}>
              <Square className="mr-2 h-4 w-4" /> Place QR Code
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Label className="text-xs">Preview name</Label>
              <Input
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="h-8 w-56"
                placeholder="Try a very long name…"
              />
            </div>
          </div>

          {mode && (
            <div className="text-sm text-primary font-medium">
              {mode === 'name' ? 'Click on the template to center the name box' : 'Click on the template to place the QR code'}
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
              <Label className="font-semibold">Name Box</Label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X (top-left)</Label>
                  <Input type="number" className="h-8"
                    value={namePosition.x}
                    onChange={(e) => patch({ x: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Y (top-left)</Label>
                  <Input type="number" className="h-8"
                    value={namePosition.y}
                    onChange={(e) => patch({ y: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input type="number" className="h-8"
                    value={namePosition.width ?? 0}
                    onChange={(e) => patch({ width: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Input type="number" className="h-8"
                    value={namePosition.height ?? 0}
                    onChange={(e) => patch({ height: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font Size (max)</Label>
                  <Input type="number" className="h-8"
                    value={namePosition.fontSize || 38}
                    onChange={(e) => patch({ fontSize: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Input type="color" className="h-8"
                    value={namePosition.color || '#1a365d'}
                    onChange={(e) => patch({ color: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={namePosition.fontFamily || 'Georgia, serif'}
                  onValueChange={(value) => patch({ fontFamily: value })}
                >
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Garamond">Garamond</SelectItem>
                    <SelectItem value="Palatino">Palatino</SelectItem>
                    <SelectItem value="Didot">Didot</SelectItem>
                    <SelectItem value="Bodoni MT">Bodoni MT</SelectItem>
                    <SelectItem value="Baskerville">Baskerville</SelectItem>
                    <SelectItem value="Copperplate">Copperplate</SelectItem>
                    <SelectItem value="Brush Script MT">Brush Script MT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Horizontal Align</Label>
                  <Select value={namePosition.align || 'center'} onValueChange={(v) => patch({ align: v as any })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Vertical Align</Label>
                  <Select value={namePosition.verticalAlign || 'middle'} onValueChange={(v) => patch({ verticalAlign: v as any })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="middle">Middle</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <Label className="text-xs">Auto-shrink long names</Label>
                  <p className="text-[11px] text-muted-foreground">Reduces font size when even wrapped text overflows the box.</p>
                </div>
                <Switch checked={namePosition.autoShrink ?? true} onCheckedChange={(v) => patch({ autoShrink: v })} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Quick Presets</Label>
                <div className="flex gap-1 flex-wrap">
                  <Button type="button" size="sm" variant="outline" onClick={() => applyPreset('center')}>Center</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyPreset('top-center')}>Top</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyPreset('bottom-center')}>Bottom</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyPreset('full-band')}>Full-width band</Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">QR Code</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X Position</Label>
                  <Input type="number" className="h-8"
                    value={qrPosition.x}
                    onChange={(e) => onQRPositionChange({ ...qrPosition, x: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Y Position</Label>
                  <Input type="number" className="h-8"
                    value={qrPosition.y}
                    onChange={(e) => onQRPositionChange({ ...qrPosition, y: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">QR Code Size</Label>
                <Input type="number" className="h-8"
                  value={qrPosition.size}
                  onChange={(e) => onQRPositionChange({ ...qrPosition, size: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
