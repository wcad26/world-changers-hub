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
  eventName: string | null,
  eventDate: string | null,
  certificateNumber: string,
  verificationCode: string,
  baseUrl: string
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

  // Configure text styling
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw recipient name (centered, 1/3 from top)
  ctx.font = 'bold 48px serif';
  ctx.fillStyle = '#1a365d';
  ctx.fillText(recipientName, canvas.width / 2, canvas.height / 3);

  // Draw event name if provided (centered, below name)
  if (eventName) {
    ctx.font = '32px serif';
    ctx.fillStyle = '#2d3748';
    ctx.fillText(eventName, canvas.width / 2, canvas.height / 2.2);
  }

  // Draw event date if provided
  if (eventDate) {
    ctx.font = '24px serif';
    ctx.fillStyle = '#4a5568';
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(formattedDate, canvas.width / 2, canvas.height / 1.8);
  }

  // Draw certificate number (bottom left)
  ctx.font = '16px monospace';
  ctx.fillStyle = '#718096';
  ctx.textAlign = 'left';
  ctx.fillText(certificateNumber, 40, canvas.height - 40);

  // Generate and draw QR code (bottom right)
  const verificationUrl = `${baseUrl}/verify/${verificationCode}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 120,
    margin: 1,
  });

  const qrImage = new Image();
  await new Promise((resolve, reject) => {
    qrImage.onload = resolve;
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });

  ctx.drawImage(qrImage, canvas.width - 160, canvas.height - 160, 120, 120);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
};
