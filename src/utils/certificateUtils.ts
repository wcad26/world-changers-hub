import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';

export const generateCertificateNumber = (regionId: string, outputType: 'certificate' | 'badge' = 'certificate'): string => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const prefix = outputType === 'badge' ? 'BADGE' : 'CERT';
  return `${prefix}-${regionId.substring(0, 4)}-${year}-${random}`;
};

export const generateVerificationCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const getVerificationUrl = (code: string, baseUrl?: string): string => {
  const url = baseUrl || window.location.origin;
  return `${url}/verify/${code}`;
};

export const downloadCertificate = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw error;
  }
};

export const downloadCertificatesAsZip = async (
  certificates: Array<{ url: string; filename: string }>
) => {
  try {
    const zip = new JSZip();
    
    // Download all certificates and add to zip
    const promises = certificates.map(async (cert) => {
      const response = await fetch(cert.url);
      const blob = await response.blob();
      zip.file(cert.filename, blob);
    });

    await Promise.all(promises);

    // Generate zip file
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `certificates-${new Date().getTime()}.zip`);
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw error;
  }
};

export const printCertificate = (url: string) => {
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const formatCertificateType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getCertificateTypeOptions = () => [
  { value: 'conference_participation', label: 'Conference Participation' },
  { value: 'training_completion', label: 'Training Completion' },
  { value: 'workshop_attendance', label: 'Workshop Attendance' },
  { value: 'leadership_training', label: 'Leadership Training' },
  { value: 'volunteer_service', label: 'Volunteer Service' },
  { value: 'achievement_award', label: 'Achievement Award' },
  { value: 'event_badge', label: 'Event Badge' },
  { value: 'attendee_badge', label: 'Attendee Badge' },
  { value: 'speaker_badge', label: 'Speaker Badge' },
  { value: 'volunteer_badge', label: 'Volunteer Badge' },
  { value: 'other', label: 'Other' },
];

const loadImageWithTimeout = (src: string, timeoutMs: number = 10000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error(`Image load timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${error}`));
    };
    
    img.src = src;
  });
};

export interface NamePosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  autoShrink?: boolean;
}

// Backwards compat: convert legacy point-based position (x,y = center) to a box
export const normalizeNamePosition = (
  pos: Partial<NamePosition> | undefined,
  canvasWidth: number,
  canvasHeight: number
): Required<Omit<NamePosition, 'width' | 'height'>> & { width: number; height: number } => {
  const fontSize = pos?.fontSize ?? 38;
  const fontFamily = pos?.fontFamily ?? 'Georgia, serif';
  const color = pos?.color ?? '#1a365d';
  const align = pos?.align ?? 'center';
  const verticalAlign = pos?.verticalAlign ?? 'middle';
  const autoShrink = pos?.autoShrink ?? true;

  if (pos?.width && pos?.height) {
    return {
      x: pos.x ?? 0,
      y: pos.y ?? 0,
      width: pos.width,
      height: pos.height,
      fontSize,
      fontFamily,
      color,
      align,
      verticalAlign,
      autoShrink,
    };
  }
  // Legacy: (x,y) was center point. Build a default box around it.
  const width = Math.round(canvasWidth * 0.6);
  const height = Math.round(fontSize * 2.5);
  const cx = pos?.x ?? canvasWidth / 2;
  const cy = pos?.y ?? canvasHeight / 2;
  return {
    x: Math.round(cx - width / 2),
    y: Math.round(cy - height / 2),
    width,
    height,
    fontSize,
    fontFamily,
    color,
    align,
    verticalAlign,
    autoShrink,
  };
};

interface MeasureCtx {
  measureText: (s: string) => { width: number };
  font: string;
}

// Word-wrap with character-level fallback for very long tokens
export const wrapTextLines = (ctx: MeasureCtx, text: string, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  const pushCurrent = () => { if (current) { lines.push(current); current = ''; } };

  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
      continue;
    }
    // word alone might exceed width — break it
    if (ctx.measureText(word).width > maxWidth) {
      pushCurrent();
      let chunk = '';
      for (const ch of word) {
        const t = chunk + ch;
        if (ctx.measureText(t).width <= maxWidth) chunk = t;
        else { if (chunk) lines.push(chunk); chunk = ch; }
      }
      current = chunk;
    } else {
      pushCurrent();
      current = word;
    }
  }
  pushCurrent();
  return lines.length ? lines : [text];
};

export interface WrapResult {
  lines: string[];
  fontSize: number;
  lineHeight: number;
}

export const fitWrappedText = (
  ctx: MeasureCtx,
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontFamily: string,
  startFontSize: number,
  autoShrink: boolean,
  bold = true
): WrapResult => {
  const minFontSize = Math.max(8, Math.floor(startFontSize * 0.5));
  let size = startFontSize;
  while (size >= minFontSize) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${fontFamily}`;
    const lines = wrapTextLines(ctx, text, maxWidth);
    const lineHeight = size * 1.2;
    const totalHeight = lines.length * lineHeight;
    if (!autoShrink || totalHeight <= maxHeight) {
      return { lines, fontSize: size, lineHeight };
    }
    size -= 2;
  }
  ctx.font = `${bold ? 'bold ' : ''}${minFontSize}px ${fontFamily}`;
  const lines = wrapTextLines(ctx, text, maxWidth);
  return { lines, fontSize: minFontSize, lineHeight: minFontSize * 1.2 };
};

export const drawWrappedNameOnCanvas = (
  ctx: CanvasRenderingContext2D,
  recipientName: string,
  box: ReturnType<typeof normalizeNamePosition>
) => {
  const { lines, fontSize, lineHeight } = fitWrappedText(
    ctx, recipientName, box.width, box.height, box.fontFamily, box.fontSize, box.autoShrink
  );
  ctx.font = `bold ${fontSize}px ${box.fontFamily}`;
  ctx.fillStyle = box.color;

  const totalTextHeight = lines.length * lineHeight;
  let yStart: number;
  if (box.verticalAlign === 'top') yStart = box.y + lineHeight / 2;
  else if (box.verticalAlign === 'bottom') yStart = box.y + box.height - totalTextHeight + lineHeight / 2;
  else yStart = box.y + (box.height - totalTextHeight) / 2 + lineHeight / 2;

  let xAnchor: number;
  if (box.align === 'left') { ctx.textAlign = 'left'; xAnchor = box.x; }
  else if (box.align === 'right') { ctx.textAlign = 'right'; xAnchor = box.x + box.width; }
  else { ctx.textAlign = 'center'; xAnchor = box.x + box.width / 2; }
  ctx.textBaseline = 'middle';

  lines.forEach((line, i) => {
    ctx.fillText(line, xAnchor, yStart + i * lineHeight);
  });
};

export const generateCertificateImage = async (
  templateUrl: string,
  recipientName: string,
  certificateNumber: string,
  verificationCode: string,
  baseUrl: string,
  namePosition?: Partial<NamePosition>,
  qrPosition?: { x: number; y: number; size: number }
): Promise<Blob> => {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const template = await loadImageWithTimeout(templateUrl);
  canvas.width = template.width;
  canvas.height = template.height;
  ctx.drawImage(template, 0, 0);

  const box = normalizeNamePosition(namePosition, canvas.width, canvas.height);
  drawWrappedNameOnCanvas(ctx, recipientName, box);

  // Generate and draw QR code
  const verificationUrl = `${baseUrl}/verify/${verificationCode}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: qrPosition?.size ?? 100,
    margin: 0,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const qrImage = new Image();
  await new Promise((resolve, reject) => {
    qrImage.onload = resolve;
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });

  const qrX = qrPosition?.x ?? (canvas.width - 92);
  const qrY = qrPosition?.y ?? (canvas.height - 109);
  const qrSize = qrPosition?.size ?? 100;
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
};
