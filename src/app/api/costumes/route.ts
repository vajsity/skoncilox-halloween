import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { isCategory } from '@/lib/types';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = String(formData.get('name') ?? '').trim();
  const category = formData.get('category');
  const photo = formData.get('photo');

  if (!name || name.length > 60) {
    return NextResponse.json({ error: 'Meno kostýmu musí mať 1 až 60 znakov.' }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: 'Neplatná kategória.' }, { status: 400 });
  }

  let photoUrl: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: 'Fotka musí byť JPEG, PNG, WEBP alebo HEIC.' }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Fotka je príliš veľká (max 8 MB).' }, { status: 400 });
    }

    const extension = photo.type.split('/')[1] || 'jpg';
    const pathname = `costumes/${crypto.randomUUID()}.${extension}`;

    const blob = await put(pathname, photo, {
      access: 'public',
      contentType: photo.type,
    });
    photoUrl = blob.url;
  }

  const rows = await sql`
    INSERT INTO costumes (name, category, photo_url)
    VALUES (${name}, ${category}, ${photoUrl})
    RETURNING id, name, category, photo_url, created_at
  `;

  return NextResponse.json({ costume: { ...rows[0], vote_count: 0 } }, { status: 201 });
}
