import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isCategory } from '@/lib/types';

function isTrustedBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: { name?: unknown; category?: unknown; photoUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná požiadavka.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = body.category;
  const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl : null;

  if (!name || name.length > 60) {
    return NextResponse.json({ error: 'Meno kostýmu musí mať 1 až 60 znakov.' }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: 'Neplatná kategória.' }, { status: 400 });
  }
  if (photoUrl && !isTrustedBlobUrl(photoUrl)) {
    return NextResponse.json({ error: 'Neplatná fotka.' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO costumes (name, category, photo_url)
    VALUES (${name}, ${category}, ${photoUrl})
    RETURNING id, name, category, photo_url, created_at
  `;

  return NextResponse.json({ costume: { ...rows[0], vote_count: 0 } }, { status: 201 });
}
