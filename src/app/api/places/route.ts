import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Place from '@/models/Place';
import { defaultPlaces } from '@/lib/seedData';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const count = await Place.countDocuments();
    if (count === 0) {
      await Place.insertMany(defaultPlaces);
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    
    let query: any = {};
    if (city) {
      query.city = city;
    }

    const places = await Place.find(query).sort({ order: 1 });
    return NextResponse.json({ success: true, data: places });
  } catch (error: any) {
    console.error('Places fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
