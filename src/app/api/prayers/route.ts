import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prayer from '@/models/Prayer';
import { defaultPrayers } from '@/lib/seedData';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const count = await Prayer.countDocuments();
    if (count === 0) {
      await Prayer.insertMany(defaultPrayers);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query: any = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { transliteration: { $regex: search, $options: 'i' } },
        { translation: { $regex: search, $options: 'i' } }
      ];
    }

    const prayers = await Prayer.find(query).sort({ order: 1 });
    return NextResponse.json({ success: true, data: prayers });
  } catch (error: any) {
    console.error('Prayers fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
