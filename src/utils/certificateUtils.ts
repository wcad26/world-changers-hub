import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
