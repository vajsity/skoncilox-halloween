'use client';

import { useRef, useState } from 'react';
import type { Category, Costume } from '@/lib/types';

const NAME_STORAGE_KEY = 'voter_name';

function readStoredName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(NAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function VotingGrid({
  costumes,
  category,
  initialVotedId,
}: {
  costumes: Costume[];
  category: Category;
  initialVotedId: number | null;
}) {
  const [votedId, setVotedId] = useState<number | null>(initialVotedId);
  const [counts, setCounts] = useState<Record<number, number>>(() =>
    Object.fromEntries(costumes.map((c) => [c.id, c.vote_count]))
  );
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [voterName, setVoterName] = useState(readStoredName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  async function handleVote(costumeId: number) {
    if (votedId !== null || pendingId !== null) return;

    const trimmedName = voterName.trim();
    if (!trimmedName) {
      setError('Pred hlasovaním napíš svoje meno.');
      nameInputRef.current?.focus();
      return;
    }

    setPendingId(costumeId);
    setError('');

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costumeId, category, voterName: trimmedName }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setVotedId(data.votedCostumeId ?? costumeId);
        }
        setError(data.error ?? 'Niečo sa pokazilo, skús znova.');
        return;
      }

      try {
        window.localStorage.setItem(NAME_STORAGE_KEY, trimmedName);
      } catch {
        // localStorage unavailable, ignore
      }

      setCounts((prev) => ({ ...prev, [costumeId]: (prev[costumeId] ?? 0) + 1 }));
      setVotedId(costumeId);
    } catch {
      setError('Chyba siete. Skontroluj pripojenie a skús znova.');
    } finally {
      setPendingId(null);
    }
  }

  const isLocked = votedId !== null;

  return (
    <div className="flex flex-col gap-4 pb-4">
      {!isLocked && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[var(--text-dim)]">Tvoje meno</span>
          <input
            ref={nameInputRef}
            type="text"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            maxLength={40}
            placeholder="napr. Janko Hraško"
            suppressHydrationWarning
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base outline-none focus:border-orange-500"
          />
        </label>
      )}

      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-300">{error}</p>
      )}

      {costumes.map((costume) => {
        const isVotedForThis = votedId === costume.id;
        const isPending = pendingId === costume.id;

        return (
          <div
            key={costume.id}
            className={`overflow-hidden rounded-2xl border bg-[var(--card)] transition ${
              isVotedForThis ? 'border-orange-500' : 'border-[var(--border)]'
            }`}
          >
            {costume.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={costume.photo_url}
                alt={costume.name}
                className="h-56 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-[var(--bg-elevated)] text-5xl">
                🎭
              </div>
            )}

            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-[var(--text)]">{costume.name}</p>
                <p className="text-xs text-[var(--text-dim)]">
                  {counts[costume.id] ?? 0} {(counts[costume.id] ?? 0) === 1 ? 'hlas' : 'hlasov'}
                </p>
              </div>

              <button
                onClick={() => handleVote(costume.id)}
                disabled={isLocked || isPending}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition active:scale-95 disabled:active:scale-100 ${
                  isVotedForThis
                    ? 'bg-green-500 text-[#0d1f0f]'
                    : isLocked
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-dim)]'
                      : 'bg-purple-500 text-white'
                }`}
              >
                {isPending ? '...' : isVotedForThis ? '✓ Hlasované' : 'Hlasovať'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
