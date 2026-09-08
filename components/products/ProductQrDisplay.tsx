'use client';

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Download } from 'lucide-react';
import { API_BASE } from '@/lib/api';

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
  const [imageFailed, setImageFailed] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);

  const apiImageSrc = productId ? `${API_BASE}/api/products/${productId}/qr-image` : undefined;
  const remoteImageSrc =
    qrCodeImage || (apiImageSrc && !imageFailed ? apiImageSrc : undefined);

  useEffect(() => {
    if (!qrCodePayload) {
      setGeneratedQr(null);
      return;
    }
    if (remoteImageSrc && !imageFailed) {
      setGeneratedQr(null);
      return;
    }

    let cancelled = false;
    void QRCodeLib.toDataURL(qrCodePayload, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setGeneratedQr(url);
      })
      .catch(() => {
        if (!cancelled) setGeneratedQr(null);
      });

    return () => {
      cancelled = true;
    };
  }, [qrCodePayload, remoteImageSrc, imageFailed]);

  const displaySrc = remoteImageSrc || generatedQr;

  if (!qrCode && !displaySrc && !qrCodePayload) return null;

  const downloadHref = displaySrc || (productId ? apiImageSrc : undefined);

  const handleDownload = () => {
    if (!downloadHref) return;

    const link = document.createElement('a');
    link.href = downloadHref;
    link.download = `qr-${qrCode || productName || 'produit'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`rounded-xl border border-border bg-card ${compact ? 'p-3' : 'p-4 sm:p-5'}`}
    >
      <p className={`font-semibold ${compact ? 'text-sm mb-2' : 'mb-3'}`}>Code QR produit</p>

      <div className="flex flex-col items-center gap-3">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={`QR code ${productName || 'produit'}`}
            className={`rounded-lg border border-border bg-white p-2 ${
              compact ? 'w-28 h-28' : 'w-40 h-40 sm:w-48 sm:h-48'
            } object-contain`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className={`rounded-lg border border-border bg-muted animate-pulse ${
              compact ? 'w-28 h-28' : 'w-40 h-40 sm:w-48 sm:h-48'
            }`}
          />
        )}

        {qrCode ? (
          <p className="text-xs text-muted-foreground break-all text-center max-w-full font-mono">
            {qrCode}
          </p>
        ) : null}

        {productName ? (
          <p className="text-xs font-semibold text-center text-foreground">{productName}</p>
        ) : null}

        {downloadHref ? (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Download className="w-4 h-4" />
            Télécharger l&apos;image QR
          </button>
        ) : null}
      </div>
    </div>
  );
}
