import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prayer from '@/models/Prayer';
import Rule from '@/models/Rule';
import Place from '@/models/Place';
import { defaultPrayers, defaultRules, defaultPlaces } from '@/lib/seedData';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (force) {
      await Prayer.deleteMany({});
      await Rule.deleteMany({});
      await Place.deleteMany({});
    }
    
    const prayerCount = await Prayer.countDocuments();
    let prayersAdded = 0;
    if (prayerCount === 0 || force) {
      await Prayer.insertMany(defaultPrayers);
      prayersAdded = defaultPrayers.length;
    }
    
    const ruleCount = await Rule.countDocuments();
    let rulesAdded = 0;
    if (ruleCount === 0 || force) {
      await Rule.insertMany(defaultRules);
      rulesAdded = defaultRules.length;
    }

    const placeCount = await Place.countDocuments();
    let placesAdded = 0;
    if (placeCount === 0 || force) {
      await Place.insertMany(defaultPlaces);
      placesAdded = defaultPlaces.length;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: force ? 'Veritabanı sıfırlandı ve yeniden seed edildi.' : 'Veritabanı kontrol edildi/güncellendi.',
      stats: {
        prayers: { total: await Prayer.countDocuments(), added: prayersAdded },
        rules: { total: await Rule.countDocuments(), added: rulesAdded },
        places: { total: await Place.countDocuments(), added: placesAdded }
      }
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
