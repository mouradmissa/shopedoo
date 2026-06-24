'use client';

import { Download } from 'lucide-react';

interface ProductQrDisplayProps {
  qrCode?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
  productName?: string;
  productId?: string;
  compact?: boolean;
}

export function ProductQrDisplay({
  qrCode,
  qrCodeImage,
  qrCodePayload,
  productName,
  productId,
  compact = false,
}: ProductQrDisplayProps) {
  if (!qrCode && !qrCodeImage) return null;

  const downloadHref =
    productId && qrCode
      ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000'}/api/products/${productId}/qr-image`
      : qrCodeImage;

  const handleDownload = () => {
    if (qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `qr-${qrCode || productName || 'produit'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (downloadHref) {
      window.open(downloadHref, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`rounded-xl border border-border bg-card ${compact ? 'p-3' : 'p-4 sm:p-5'}`}
    >
      <p className={`font-semibold ${compact ? 'text-sm mb-2' : 'mb-3'}`}>Code QR produit</p>

      {qrCodeImage ? (
        <div className="flex flex-col items-center gap-3">
          <img
            src={qrCodeImage}
            alt={`QR code ${productName || 'produit'}`}
            className={`rounded-lg border border-border bg-white p-2 ${
              compact ? 'w-28 h-28' : 'w-40 h-40 sm:w-48 sm:h-48'
            } object-contain`}
          />
          {qrCode && (
            <p className="text-xs text-muted-foreground break-all text-center max-w-full">
              {qrCode}
            </p>
          )}
          {qrCodePayload && (
            <p className="text-xs text-primary break-all text-center max-w-full">{qrCodePayload}</p>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Download className="w-4 h-4" />
            Télécharger l&apos;image QR
          </button>
        </div>
      ) : (
        <div className="py-8" />
      )}
    </div>
  );
}
