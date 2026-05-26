import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rule from '@/models/Rule';
import { defaultRules } from '@/lib/seedData';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const count = await Rule.countDocuments();
    if (count === 0) {
      await Rule.insertMany(defaultRules);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query: any = {};
    if (category) {
      query.category = category;
    }

    const rules = await Rule.find(query);
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('Rules fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
