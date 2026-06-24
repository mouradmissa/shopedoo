'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

interface ProductImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingImageUrl?: string;
  className?: string;
}

export function ProductImageUpload({
  value,
  onChange,
  existingImageUrl,
  className,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value) {
      setPreview(existingImageUrl || null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value, existingImageUrl]);

  const handleFile = (file: File | undefined) => {
    setError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('Image trop volumineuse (max 5 Mo).');
      return;
    }

    onChange(file);
  };

  const clear = () => {
    onChange(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    setPreview(existingImageUrl || null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium">Photo du produit</label>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative w-28 h-28 rounded-xl border-2 border-dashed border-border bg-muted/40 overflow-hidden shrink-0">
          {preview ? (
            <>
              <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
              {(value || existingImageUrl) && (
                <button
                  type="button"
                  onClick={clear}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/90 border border-border shadow-sm hover:bg-destructive/10"
                  title="Retirer l'image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2">
              <ImagePlus className="w-8 h-8 mb-1 opacity-60" />
              <span className="text-[10px] text-center leading-tight">Aucune photo</span>
            </div>
          )}
        </div>

        <div className="flex-1 w-full">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-3 border border-border rounded-lg bg-background hover:bg-muted transition text-sm font-semibold"
          >
            Choisir depuis le PC
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            JPEG, PNG, WebP ou GIF — max 5 Mo. L&apos;image est enregistrée dans MongoDB Atlas et
            accessible sur tous vos appareils.
          </p>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
