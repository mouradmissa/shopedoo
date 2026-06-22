'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, X } from 'lucide-react';
import jsQR from 'jsqr';
import { formatPrice } from '@/lib/currency';

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
      return;
    }
  }, [isAuthenticated, router]);

  const startScanning = async () => {
    setError('');
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        scanQR();
      }
    } catch (err: any) {
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const scanQR = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      fetchProductByQR(code.data);
    } else if (isScanning) {
      setTimeout(scanQR, 100);
    }
  };

  const fetchProductByQR = async (qrCode: string) => {
    setIsLoading(true);
    const response = await apiClient.getProductByQR(qrCode);
    setIsLoading(false);

    if (response.success) {
      setScannedProduct(response.data);
      stopScanning();
    } else {
      setError('Product not found. Please try another QR code.');
      setTimeout(() => {
        if (isScanning) scanQR();
      }, 2000);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const addScannedProductToCart = async () => {
    if (!scannedProduct) return;

    const response = await apiClient.addToCart(scannedProduct._id, 1);
    if (response.success) {
      alert('Added to cart!');
      setScannedProduct(null);
      setIsLoading(false);
    }
  };

  const viewProductDetails = () => {
    if (scannedProduct) {
      router.push(`/products/${scannedProduct._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back</span>
          </Link>
          <h1 className="font-bold text-xl flex items-center gap-2">
            <Camera className="w-6 h-6" />
            QR Scanner
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {!isScanning && !scannedProduct ? (
          <div className="text-center py-20">
            <div className="bg-card rounded-2xl border border-border p-12 mb-6">
              <Camera className="w-24 h-24 text-primary mx-auto mb-6 opacity-75" />
              <h2 className="text-2xl font-bold mb-4">Scan Product QR Code</h2>
              <p className="text-muted-foreground mb-8">
                Point your camera at a product QR code to instantly view details and add to cart
              </p>
              <button
                onClick={startScanning}
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Start Camera
              </button>
            </div>
          </div>
        ) : null}

        {isScanning && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-2 border-primary bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-primary/50 rounded-lg"></div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Scanning...</p>
              </div>
            )}

            <button
              onClick={stopScanning}
              className="w-full py-3 border border-destructive bg-destructive/10 text-destructive rounded-lg font-semibold hover:bg-destructive/20 transition flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Stop Scanning
            </button>
          </div>
        )}

        {scannedProduct && (
          <div className="bg-card rounded-2xl border border-border p-8">
            <h2 className="text-2xl font-bold mb-6">Product Found!</h2>

            <div className="space-y-6">
              {scannedProduct.image && (
                <img
                  src={scannedProduct.image}
                  alt={scannedProduct.name}
                  className="w-full aspect-square object-cover rounded-lg bg-muted"
                />
              )}

              <div>
                <h3 className="text-3xl font-bold mb-2">{scannedProduct.name}</h3>
                <p className="text-muted-foreground text-lg mb-4">{scannedProduct.description}</p>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(scannedProduct.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{scannedProduct.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock</span>
                    <span className={scannedProduct.stock > 0 ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                      {scannedProduct.stock > 0 ? `${scannedProduct.stock} available` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={addScannedProductToCart}
                  disabled={scannedProduct.stock === 0}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  Add to Cart
                </button>
                <button
                  onClick={viewProductDetails}
                  className="flex-1 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition"
                >
                  View Details
                </button>
              </div>

              <button
                onClick={() => {
                  setScannedProduct(null);
                  setError('');
                  startScanning();
                }}
                className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                Scan Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
