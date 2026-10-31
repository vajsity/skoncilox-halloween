import Link from 'next/link';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { DEVICE_COOKIE } from '@/lib/device';
import type { Category, Costume } from '@/lib/types';
import VotingGrid from '@/components/VotingGrid';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category: Category = params.category === 'pair' ? 'pair' : 'solo';

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value ?? null;

  const costumesRows = await sql`
    SELECT c.id, c.name, c.category, c.photo_url, c.created_at,
           COUNT(v.id)::int AS vote_count
    FROM costumes c
    LEFT JOIN votes v ON v.costume_id = c.id
    WHERE c.category = ${category}
    GROUP BY c.id
    ORDER BY vote_count DESC, c.created_at ASC
  `;
  const costumes = costumesRows as unknown as Costume[];

  const votedRows = deviceId
    ? await sql`SELECT costume_id FROM votes WHERE category = ${category} AND device_id = ${deviceId}`
    : [];
  const votedCostumeId = (votedRows[0]?.costume_id as number | undefined) ?? null;

  return (
    <main className="min-h-screen pb-28">
      <header className="px-5 pt-8 pb-4 text-center">
        <h1
          className="text-4xl text-orange-400 drop-shadow-[0_2px_12px_rgba(255,122,26,0.45)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          🎃 Halloween Kostýmy
        </h1>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Hlasuj za najlepší kostým párty. Jeden hlas na zariadenie v každej kategórii.
        </p>
      </header>

      <nav className="sticky top-0 z-10 mx-auto mb-5 flex max-w-md gap-2 bg-[var(--bg)]/90 px-5 py-3 backdrop-blur">
        <CategoryTab href="/?category=solo" active={category === 'solo'} label="🧍 Solo" />
        <CategoryTab href="/?category=pair" active={category === 'pair'} label="👯 Dvojice" />
      </nav>

      <section className="mx-auto max-w-md px-4">
        {costumes.length === 0 ? (
          <p className="mt-10 text-center text-[var(--text-dim)]">
            Zatiaľ žiadne kostýmy v tejto kategórii. Buď prvý, kto nejaký pridá!
          </p>
        ) : (
          <VotingGrid key={category} costumes={costumes} category={category} initialVotedId={votedCostumeId} />
        )}
      </section>

      <Link
        href={`/add?category=${category}`}
        className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 font-semibold text-[#1a0f29] shadow-lg shadow-orange-900/50 active:scale-95"
      >
        <span className="text-lg">➕</span> Pridať kostým
      </Link>
    </main>
  );
}

function CategoryTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition ${
        active
          ? 'bg-orange-500 text-[#1a0f29] shadow shadow-orange-900/40'
          : 'bg-[var(--card)] text-[var(--text-dim)]'
      }`}
    >
      {label}
    </Link>
  );
}
