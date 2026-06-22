'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface InvoiceQrImageProps {
  value: string;
  size?: number;
}

export function InvoiceQrImage({ value, size = 240 }: InvoiceQrImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(value, { width: size, margin: 2 }))
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-xl"
        style={{ width: size, height: size }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR code facture"
      width={size}
      height={size}
      className="rounded-xl border border-border bg-white p-2"
    />
  );
}
