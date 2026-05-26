import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FamilyMember from '@/models/FamilyMember';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { groupCode, deviceId, name, latitude, longitude } = body;

    if (!groupCode || !deviceId || !name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: 'Eksik bilgi gönderildi.' }, { status: 400 });
    }

    const cleanGroupCode = groupCode.toUpperCase().trim();

    // Update location or insert if new
    const member = await FamilyMember.findOneAndUpdate(
      { groupCode: cleanGroupCode, deviceId },
      {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: member });
  } catch (error: any) {
    console.error('Family location update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
