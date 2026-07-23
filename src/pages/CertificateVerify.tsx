import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Download, Printer, Calendar, Award } from 'lucide-react';
import { useCertificateByCode } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { downloadCertificate, printCertificate, formatCertificateType } from '@/utils/certificateUtils';

const CertificateVerify = () => {
  const { verificationCode } = useParams<{ verificationCode: string }>();
  const { data: certificate, isLoading, error } = useCertificateByCode(verificationCode || '');

  const handleDownload = () => {
    if (certificate) {
      downloadCertificate(certificate.certificate_url, `${certificate.certificate_number}.png`);
    }
  };

  const handlePrint = () => {
    if (certificate) {
      printCertificate(certificate.certificate_url);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : error || !certificate ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-12 pb-12 text-center">
              <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
              <h1 className="text-3xl font-bold mb-2">Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The verification code you entered is invalid or the item has been revoked.
              </p>
              <p className="text-sm text-muted-foreground">
                Verification Code: <code className="bg-muted px-2 py-1 rounded">{verificationCode}</code>
              </p>
            </CardContent>
          </Card>
        ) : (() => {
          const outputType = (certificate as any).output_type === 'badge' ? 'Badge' : 'Certificate';
          return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Verification Status */}
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <h1 className="text-3xl font-bold">{outputType} Verified</h1>
                </div>
                <p className="text-center text-muted-foreground">
                  This {outputType.toLowerCase()} has been verified as authentic and issued by World Changers Association
                </p>
              </CardContent>
            </Card>

            {/* Certificate Details */}
            <Card>
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center mb-6">
                  <Shield className="mx-auto h-16 w-16 text-primary mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">{outputType} Details</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>Recipient</span>
                    </div>
                    <p className="text-lg font-semibold">{certificate.recipient_name}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>{outputType} Type</span>
                    </div>
                    <p className="text-lg font-semibold">{formatCertificateType(certificate.certificate_type)}</p>
                  </div>

                  {certificate.event_name && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Event / Program</span>
                      </div>
                      <p className="text-lg font-semibold">{certificate.event_name}</p>
                    </div>
                  )}

                  {certificate.event_date && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Event Date</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {new Date(certificate.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p className="font-medium">
                      {new Date(certificate.issued_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Certificate Number</p>
                    <p className="font-mono text-sm font-medium">{certificate.certificate_number}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Issuing Region</p>
                    <p className="font-medium">{certificate.regions?.name || 'N/A'}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Verification Code</p>
                    <p className="font-mono text-sm font-medium">{certificate.verification_code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Preview */}
            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-xl font-semibold mb-4 text-center">Certificate Preview</h3>
                <div className="border rounded-lg overflow-hidden bg-muted/10">
                  <img 
                    src={certificate.certificate_url} 
                    alt="Certificate" 
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center mt-6">
                  <Button onClick={handleDownload} size="lg" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </Button>
                  <Button onClick={handlePrint} variant="outline" size="lg" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Authenticity Statement */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <h3 className="text-lg font-semibold mb-4 text-center">Authenticity Statement</h3>
                <p className="text-center text-muted-foreground leading-relaxed">
                  This certificate has been officially issued by <strong>World Changers Association</strong> and 
                  is verifiable through our secure verification system. The certificate details shown on this page 
                  match our official records. This document certifies that the recipient named above has successfully 
                  completed the requirements for the specified program or event.
                </p>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  For verification inquiries, please contact the issuing region directly.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CertificateVerify;
