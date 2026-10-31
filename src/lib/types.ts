export type Category = 'solo' | 'pair';

export type Costume = {
  id: number;
  name: string;
  category: Category;
  photo_url: string | null;
  created_at: string;
  vote_count: number;
};

export function isCategory(value: unknown): value is Category {
  return value === 'solo' || value === 'pair';
}
