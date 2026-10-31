'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Category } from '@/lib/types';

export default function AddCostumeForm({ defaultCategory }: { defaultCategory: Category }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    formData.set('category', category);

    const name = String(formData.get('name') ?? '').trim();
    if (!name) {
      setError('Zadaj meno alebo názov kostýmu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/costumes', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Nepodarilo sa pridať kostým.');
        setSubmitting(false);
        return;
      }
      router.push(`/?category=${category}`);
      router.refresh();
    } catch {
      setError('Chyba siete. Skús znova.');
      setSubmitting(false);
    }
  }

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
          capture="environment"
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
        {submitting ? 'Pridávam...' : '🎃 Pridať kostým'}
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
