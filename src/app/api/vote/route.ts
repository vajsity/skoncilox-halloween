import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { sql } from '@/lib/db';
import { DEVICE_COOKIE, getClientIp } from '@/lib/device';
import { isCategory } from '@/lib/types';

export async function POST(request: Request) {
  let body: { costumeId?: unknown; category?: unknown; voterName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná požiadavka.' }, { status: 400 });
  }

  const costumeId = Number(body.costumeId);
  const category = body.category;
  const voterName = typeof body.voterName === 'string' ? body.voterName.trim() : '';

  if (!Number.isInteger(costumeId) || !isCategory(category)) {
    return NextResponse.json({ error: 'Neplatná požiadavka.' }, { status: 400 });
  }
  if (!voterName || voterName.length > 40) {
    return NextResponse.json({ error: 'Zadaj svoje meno (max 40 znakov).' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value;
  if (!deviceId) {
    return NextResponse.json({ error: 'Chýba identifikátor zariadenia, skús obnoviť stránku.' }, { status: 400 });
  }

  const costumeRows = await sql`SELECT id, category FROM costumes WHERE id = ${costumeId}`;
  const costume = costumeRows[0] as { id: number; category: string } | undefined;

  if (!costume) {
    return NextResponse.json({ error: 'Kostým neexistuje.' }, { status: 404 });
  }
  if (costume.category !== category) {
    return NextResponse.json({ error: 'Kategória nesedí s kostýmom.' }, { status: 400 });
  }

  const existingVote = await sql`
    SELECT costume_id FROM votes WHERE category = ${category} AND device_id = ${deviceId}
  `;
  if (existingVote.length > 0) {
    return NextResponse.json(
      { error: 'Z tohto zariadenia už bolo v tejto kategórii odovzdané hlasovanie.', votedCostumeId: existingVote[0].costume_id },
      { status: 409 }
    );
  }

  const existingNameVote = await sql`
    SELECT costume_id FROM votes WHERE category = ${category} AND lower(voter_name) = lower(${voterName})
  `;
  if (existingNameVote.length > 0) {
    return NextResponse.json(
      {
        error: 'Niekto s týmto menom už v tejto kategórii hlasoval. Ak si to ty, hlas sa nestratil — len v tomto prehliadači/zariadení nevyzeráš ako prihlásený. Ak ide o zhodu mien, skús doplniť priezvisko.',
        votedCostumeId: existingNameVote[0].costume_id,
      },
      { status: 409 }
    );
  }

  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  try {
    await sql`
      INSERT INTO votes (costume_id, category, device_id, voter_name, ip)
      VALUES (${costumeId}, ${category}, ${deviceId}, ${voterName}, ${ip})
    `;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { error: 'Z tohto zariadenia už bolo v tejto kategórii odovzdané hlasovanie.' },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: 'Hlasovanie sa nepodarilo uložiť.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, costumeId });
}
