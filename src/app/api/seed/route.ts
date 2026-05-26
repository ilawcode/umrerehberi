import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prayer from '@/models/Prayer';
import Rule from '@/models/Rule';
import { defaultPrayers, defaultRules } from '@/lib/seedData';

export async function GET() {
  try {
    await dbConnect();
    
    const prayerCount = await Prayer.countDocuments();
    let prayersAdded = 0;
    if (prayerCount === 0) {
      await Prayer.insertMany(defaultPrayers);
      prayersAdded = defaultPrayers.length;
    }
    
    const ruleCount = await Rule.countDocuments();
    let rulesAdded = 0;
    if (ruleCount === 0) {
      await Rule.insertMany(defaultRules);
      rulesAdded = defaultRules.length;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Veritabanı kontrol edildi/güncellendi.',
      stats: {
        prayers: { total: await Prayer.countDocuments(), added: prayersAdded },
        rules: { total: await Rule.countDocuments(), added: rulesAdded }
      }
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
