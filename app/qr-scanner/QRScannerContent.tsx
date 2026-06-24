'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';
import { PageTitleBar } from '@/components/layout/PageTitleBar';
import { parseScannedQrData } from '@/lib/parseProductQr';

export function QRScannerContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScanningRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const stopScanning = useCallback(() => {
    isScanningRef.current = false;
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const resolveAndNavigate = useCallback(
    async (raw: string) => {
      setIsLoading(true);
      setError('');

      const parsed = parseScannedQrData(raw);

      if (parsed?.type === 'product') {
        stopScanning();
        router.push(`/products/${parsed.productId}`);
        return;
      }

      if (parsed?.type === 'code') {
        const response = await apiClient.getProductByQR(parsed.code);
        setIsLoading(false);

        if (response.success && response.data?._id) {
          stopScanning();
          router.push(`/products/${response.data._id}`);
          return;
        }

        setError('Produit introuvable. Essayez un autre QR code.');
        return;
      }

      setIsLoading(false);
      setError('QR code non reconnu. Utilisez un QR produit shopedoo.');
    },
    [router, stopScanning]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const productId = searchParams.get('product') || searchParams.get('id');
    const code = searchParams.get('code');

    if (productId && /^[a-f0-9]{24}$/i.test(productId)) {
      router.replace(`/products/${productId}`);
      return;
    }

    if (code) {
      void resolveAndNavigate(code);
    }
  }, [searchParams, router, resolveAndNavigate]);

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

    if (code?.data) {
      void resolveAndNavigate(code.data);
      return;
    }

    if (isScanningRef.current) requestAnimationFrame(scanFrame);
  }, [resolveAndNavigate]);

  const startScanning = async () => {
    setError('');
    isScanningRef.current = true;
    setIsScanning(true);

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
      setError('Autorisez la caméra pour scanner les QR produits.');
      isScanningRef.current = false;
      setIsScanning(false);
    }
  };

  return (
    <>
      <PageTitleBar
        title="Scanner QR"
        backHref="/"
        backLabel="Boutique"
        icon={<Camera className="w-4 h-4 text-primary" />}
      />

      <div className="page-container max-w-2xl py-6 sm:py-8 flex-1">
        {!isScanning ? (
          <div className="text-center py-10 sm:py-16">
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-10">
              <Camera className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto mb-4 sm:mb-6 opacity-75" />
              <h2 className="text-xl sm:text-2xl font-bold mb-6">Scanner un produit</h2>
              <button
                type="button"
                onClick={startScanning}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 min-h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ouverture...
                  </>
                ) : (
                  'Activer la caméra'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-2 border-primary bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                <div className="w-full max-w-[min(80vw,280px)] aspect-square border-4 border-primary/50 rounded-xl" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}

            <button
              type="button"
              onClick={stopScanning}
              className="w-full min-h-12 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </>
  );
}
