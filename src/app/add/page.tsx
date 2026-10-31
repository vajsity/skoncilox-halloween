import AddCostumeForm from '@/components/AddCostumeForm';
import type { Category } from '@/lib/types';

export default async function AddCostumePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category: Category = params.category === 'pair' ? 'pair' : 'solo';

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <h1 className="text-2xl font-bold text-orange-400">Nový kostým</h1>
      <p className="mt-1 text-sm text-[var(--text-dim)]">
        Pridaj kostým do súťaže. Fotka nie je povinná, ale s fotkou to má väčšiu šancu na víťazstvo 👻
      </p>
      <AddCostumeForm defaultCategory={category} />
    </main>
  );
}
