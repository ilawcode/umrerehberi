import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FamilyMember from '@/models/FamilyMember';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { groupCode, deviceId } = body;

    if (!groupCode || !deviceId) {
      return NextResponse.json({ success: false, error: 'Eksik bilgi gönderildi.' }, { status: 400 });
    }

    const cleanGroupCode = groupCode.toUpperCase().trim();
    await FamilyMember.deleteOne({ groupCode: cleanGroupCode, deviceId });

    return NextResponse.json({ success: true, message: 'Gruptan başarıyla ayrıldınız.' });
  } catch (error: any) {
    console.error('Family leave error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
