import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';

export const generateCertificateNumber = (regionId: string): string => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CERT-${regionId.substring(0, 4)}-${year}-${random}`;
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

export const generateCertificateImage = async (
  templateUrl: string,
  recipientName: string,
  certificateNumber: string,
  verificationCode: string,
  baseUrl: string,
  namePosition?: { x: number; y: number; fontSize?: number; fontFamily?: string; color?: string },
  qrPosition?: { x: number; y: number; size: number }
): Promise<Blob> => {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Load template image with timeout
  const template = await loadImageWithTimeout(templateUrl);

  // Set canvas size to match template
  canvas.width = template.width;
  canvas.height = template.height;

  // Draw template
  ctx.drawImage(template, 0, 0);

  // Use provided positions or defaults
  const namePosX = namePosition?.x ?? canvas.width / 2;
  const namePosY = namePosition?.y ?? 477;
  const fontSize = namePosition?.fontSize ?? 38;
  const fontFamily = namePosition?.fontFamily ?? 'Georgia, serif';
  const textColor = namePosition?.color ?? '#1a365d';

  // Draw recipient name
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(recipientName, namePosX, namePosY);

  // Generate and draw QR code
  const verificationUrl = `${baseUrl}/verify/${verificationCode}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: qrPosition?.size ?? 100,
    margin: 0,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  const qrImage = new Image();
  await new Promise((resolve, reject) => {
    qrImage.onload = resolve;
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });

  // Position QR code
  const qrX = qrPosition?.x ?? (canvas.width - 92);
  const qrY = qrPosition?.y ?? (canvas.height - 109);
  const qrSize = qrPosition?.size ?? 100;
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
};
