'use client';

import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Category } from '@/lib/types';

const MAX_ORIGINAL_BYTES = 120 * 1024 * 1024; // sanity cap before we even try to process it
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // cap for what we actually send, after resizing
const RESIZE_MAX_DIMENSION = 1800;
const RESIZE_QUALITY = 0.85;
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|avif|heic|heif|gif|bmp|tiff?|dng|raw|cr2|cr3|nef|arw)$/i;

function looksLikeImage(file: File): boolean {
  // Phones and OSes report inconsistent MIME types for some photos (empty,
  // or a generic fallback like application/octet-stream for HEIC/RAW), so
  // accept it if EITHER the reported type looks like an image OR the extension does.
  return file.type.startsWith('image/') || IMAGE_EXTENSION.test(file.name);
}

function withJpgExtension(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  return `${base || 'photo'}.jpg`;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = url;
  });
}

// Re-encodes the photo as a smaller JPEG client-side. This shrinks ordinary
// phone photos a lot (faster uploads on party wifi) and also rescues formats
// our upload pipeline can't otherwise handle, like multi-megabyte ProRAW
// (.dng) files straight off an iPhone, by drawing whatever the browser's
// native image decoder can open onto a canvas. If decoding fails (format the
// browser truly can't open), we fall back to the original file untouched.
async function shrinkForUpload(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const scale = Math.min(1, RESIZE_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', RESIZE_QUALITY));
    if (!blob) return file;

    return new File([blob], withJpgExtension(file.name), { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function AddCostumeForm({ defaultCategory }: { defaultCategory: Category }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'uploading' | 'saving'>('idle');
  const [error, setError] = useState('');

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') ?? '').trim();
    const photo = fileInputRef.current?.files?.[0] ?? null;

    if (!name) {
      setError('Zadaj meno alebo názov kostýmu.');
      return;
    }
    if (photo && !looksLikeImage(photo)) {
      setError('Tento súbor nevyzerá ako fotka. Skús iný formát (JPEG, PNG, WEBP, HEIC).');
      return;
    }
    if (photo && photo.size > MAX_ORIGINAL_BYTES) {
      setError('Fotka je príliš veľká. Skús inú fotku.');
      return;
    }

    try {
      let photoUrl: string | null = null;

      if (photo) {
        setStatus('processing');
        const uploadFile = await shrinkForUpload(photo);

        if (uploadFile.size > MAX_UPLOAD_BYTES) {
          setError('Fotku sa nepodarilo dostatočne zmenšiť. Skús inú fotku (nie RAW/DNG formát).');
          setStatus('idle');
          return;
        }

        setStatus('uploading');
        const blob = await upload(uploadFile.name, uploadFile, {
          access: 'public',
          handleUploadUrl: '/api/blob-upload',
          contentType: uploadFile.type,
        });
        photoUrl = blob.url;
      }

      setStatus('saving');
      const res = await fetch('/api/costumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Nepodarilo sa pridať kostým.');
        setStatus('idle');
        return;
      }
      router.push(`/?category=${category}`);
      router.refresh();
    } catch {
      setError('Nepodarilo sa nahrať fotku alebo pridať kostým. Skontroluj pripojenie a skús znova.');
      setStatus('idle');
    }
  }

  const submitting = status !== 'idle';
  const submitLabel =
    status === 'processing'
      ? 'Spracúvam fotku...'
      : status === 'uploading'
        ? 'Nahrávam fotku...'
        : status === 'saving'
          ? 'Pridávam...'
          : '🎃 Pridať kostým';

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
      <div>
        <span className="mb-2 block text-sm font-semibold text-[var(--text-dim)]">Kategória</span>
        <div className="flex gap-2">
          <CategoryOption label="🧍 Solo" value="solo" selected={category === 'solo'} onSelect={setCategory} />
          <CategoryOption label="👯 Dvojice" value="pair" selected={category === 'pair'} onSelect={setCategory} />
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--text-dim)]">Meno / názov kostýmu</span>
        <input
          name="name"
          type="text"
          required
          maxLength={60}
          placeholder="napr. Zombie čašníčka"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base outline-none focus:border-orange-500"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--text-dim)]">Fotka (nepovinné)</span>
        <input
          ref={fileInputRef}
          name="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-dim)] file:mr-3 file:rounded-full file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#1a0f29]"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Náhľad" className="mt-2 h-56 w-full rounded-xl object-cover" />
        )}
      </label>

      {error && <p className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-orange-500 py-3.5 text-center font-bold text-[#1a0f29] active:scale-95 disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function CategoryOption({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: Category;
  selected: boolean;
  onSelect: (value: Category) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
        selected ? 'bg-orange-500 text-[#1a0f29]' : 'bg-[var(--card)] text-[var(--text-dim)]'
      }`}
    >
      {label}
    </button>
  );
}
