'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Camera, X } from 'lucide-react';
import jsQR from 'jsqr';
import { formatPrice } from '@/lib/currency';
import { formatCategory } from '@/lib/productCategories';
import { PageHeader } from '@/components/layout/PageHeader';

interface ScannedProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  qrCode: string;
}

export default function QRScannerPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  const startScanning = async () => {
    setError('');
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanQR();
      }
    } catch {
      setError('Autorisez la caméra pour scanner les QR produits.');
      setIsScanning(false);
    }
  };

  const scanQR = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isScanning) requestAnimationFrame(scanQR);
      return;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      fetchProductByQR(code.data);
      return;
    }

    if (isScanning) requestAnimationFrame(scanQR);
  };

  const fetchProductByQR = async (qrCode: string) => {
    setIsLoading(true);
    const response = await apiClient.getProductByQR(qrCode);
    setIsLoading(false);

    if (response.success) {
      setScannedProduct(response.data);
      stopScanning();
    } else {
      setError('Produit introuvable. Essayez un autre QR code.');
      requestAnimationFrame(scanQR);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const addScannedProductToCart = async () => {
    if (!scannedProduct) return;

    const response = await apiClient.addToCart(scannedProduct._id, 1);
    if (response.success) {
      router.push('/cart');
    }
  };

  const viewProductDetails = () => {
    if (scannedProduct) {
      router.push(`/products/${scannedProduct._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <PageHeader
        title="Scanner QR"
        backHref="/"
        backLabel="Boutique"
        icon={<Camera className="w-5 h-5 shrink-0" />}
      />

      <div className="page-container max-w-2xl py-6 sm:py-8">
        {!isScanning && !scannedProduct ? (
          <div className="text-center py-10 sm:py-16">
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-10">
              <Camera className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto mb-4 sm:mb-6 opacity-75" />
              <h2 className="text-xl sm:text-2xl font-bold mb-3">Scanner un produit</h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
                Pointez la caméra vers le QR code d&apos;un produit pour voir les détails
              </p>
              <button
                type="button"
                onClick={startScanning}
                className="inline-block w-full sm:w-auto px-8 py-3 min-h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Activer la caméra
              </button>
            </div>
          </div>
        ) : null}

        {isScanning && (
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
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Recherche du produit...</p>
              </div>
            )}

            <button
              type="button"
              onClick={stopScanning}
              className="w-full min-h-12 py-3 border border-destructive bg-destructive/10 text-destructive rounded-lg font-semibold hover:bg-destructive/20 transition flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Arrêter le scan
            </button>
          </div>
        )}

        {scannedProduct && (
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Produit trouvé</h2>

            <div className="space-y-5 sm:space-y-6">
              {scannedProduct.image && (
                <img
                  src={scannedProduct.image}
                  alt={scannedProduct.name}
                  className="w-full max-h-64 sm:max-h-none sm:aspect-square object-cover rounded-lg bg-muted"
                />
              )}

              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 break-words">{scannedProduct.name}</h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-4 break-words">
                  {scannedProduct.description}
                </p>

                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      {formatPrice(scannedProduct.price)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="font-medium">{formatCategory(scannedProduct.category)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Stock</span>
                    <span
                      className={
                        scannedProduct.stock > 0 ? 'text-green-600 font-medium' : 'text-destructive font-medium'
                      }
                    >
                      {scannedProduct.stock > 0
                        ? `${scannedProduct.stock} disponible${scannedProduct.stock > 1 ? 's' : ''}`
                        : 'Rupture de stock'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={addScannedProductToCart}
                  disabled={scannedProduct.stock === 0}
                  className="flex-1 min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  Ajouter au panier
                </button>
                <button
                  type="button"
                  onClick={viewProductDetails}
                  className="flex-1 min-h-12 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition"
                >
                  Voir détails
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setScannedProduct(null);
                  setError('');
                  startScanning();
                }}
                className="w-full min-h-12 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Scanner un autre produit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
