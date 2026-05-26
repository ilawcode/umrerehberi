import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FamilyMember from '@/models/FamilyMember';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const groupCode = searchParams.get('groupCode');

    if (!groupCode) {
      return NextResponse.json({ success: false, error: 'Grup kodu belirtilmedi.' }, { status: 400 });
    }

    const cleanGroupCode = groupCode.toUpperCase().trim();
    const members = await FamilyMember.find({ groupCode: cleanGroupCode }).sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    console.error('Family members fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
