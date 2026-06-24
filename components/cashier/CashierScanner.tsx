'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import jsQR from 'jsqr';
import {
  Camera,
  ScanLine,
  Smartphone,
} from 'lucide-react';
import {
  parseInvoiceQr,
  qrPayloadToCashierView,
  CashierInvoiceView,
  INVOICE_QR_PREFIX,
} from '@/lib/invoiceQr';
import { CashierInvoiceDisplay } from '@/components/cashier/CashierInvoiceDisplay';

type View = 'scan' | 'invoice';

export function CashierScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScanningRef = useRef(false);
  const lastScanRef = useRef('');

  const [view, setView] = useState<View>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [invoice, setInvoice] = useState<CashierInvoiceView | null>(null);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const stopScanning = useCallback(() => {
    isScanningRef.current = false;
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const processScannedData = useCallback(
    (raw: string) => {
      if (raw === lastScanRef.current) return false;

      const payload = parseInvoiceQr(raw);
      if (!payload) return false;

      lastScanRef.current = raw;
      stopScanning();
      setError('');
      setConfirmed(false);
      setInvoice(qrPayloadToCashierView(payload));
      setView('invoice');

      if (navigator.vibrate) navigator.vibrate(120);
      return true;
    },
    [stopScanning]
  );

  const scanFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isScanningRef.current) requestAnimationFrame(scanFrame);
      return;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code?.data?.startsWith(INVOICE_QR_PREFIX)) {
      processScannedData(code.data);
      return;
    }

    if (isScanningRef.current) requestAnimationFrame(scanFrame);
  }, [processScannedData]);

  const startScanning = useCallback(async () => {
    setError('');
    lastScanRef.current = '';
    isScanningRef.current = true;
    setIsScanning(true);
    setView('scan');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        requestAnimationFrame(scanFrame);
      }
    } catch {
      setError('Autorisez la caméra pour scanner le QR sur le téléphone du client.');
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [scanFrame]);

  useEffect(() => {
    if (view === 'scan' && !invoice) {
      startScanning();
    }
    return () => stopScanning();
  }, []);

  const confirmPayment = async () => {
    if (!invoice?.invoiceQrCode) return;
    setIsConfirming(true);
    setError('');

    const response = await apiClient.confirmCashPayment(invoice.invoiceQrCode);
    setIsConfirming(false);

    if (response.success) {
      setConfirmed(true);
      setInvoice({ ...invoice, status: 'paid' });
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    } else {
      setError(response.error || 'Échec de la confirmation');
    }
  };

  const scanNext = () => {
    setInvoice(null);
    setConfirmed(false);
    setError('');
    lastScanRef.current = '';
    setView('scan');
    startScanning();
  };

  if (view === 'scan') {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative bg-black min-h-[45vh] max-h-[60vh] sm:max-h-none sm:min-h-[50vh] rounded-b-2xl overflow-hidden mx-4 sm:mx-6 mt-4 border border-border shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-[min(80vw,280px)] aspect-square border-2 border-primary rounded-2xl relative">
              <span className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <span className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <span className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <span className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              <div className="absolute inset-x-4 top-1/2 h-0.5 bg-primary/60 animate-pulse" />
            </div>
          </div>

          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <button
                onClick={startScanning}
                className="flex flex-col items-center gap-3 px-8 py-6 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl transition pointer-events-auto"
              >
                <Camera className="w-10 h-10" />
                <span className="font-semibold">Activer la caméra</span>
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 sm:p-6 space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Scannez le QR du client</p>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              {error}
            </p>
          )}
          {isScanning && (
            <div className="flex items-center justify-center py-2">
              <ScanLine className="w-4 h-4 animate-pulse text-primary" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <CashierInvoiceDisplay
      invoice={invoice}
      confirmed={confirmed}
      error={error}
      isConfirming={isConfirming}
      onConfirm={confirmPayment}
      onScanNext={scanNext}
    />
  );
}
