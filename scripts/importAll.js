const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load env variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/umrerehberi';

// Define Mongoose schemas
const PrayerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  arabic: { type: String, required: true },
  transliteration: { type: String, required: true },
  translation: { type: String, required: true },
  category: { type: String, required: true },
  order: { type: Number, default: 0 },
});

const RuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  penalty: { type: String, required: true },
});

const PlaceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  city: { type: String, required: true },
  importance: { type: String, required: true },
  order: { type: Number, default: 0 },
});

const Prayer = mongoose.models.Prayer || mongoose.model('Prayer', PrayerSchema);
const Rule = mongoose.models.Rule || mongoose.model('Rule', RuleSchema);
const Place = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

async function run() {
  const tempPath = path.join(__dirname, 'tempSeedData.js');
  try {
    console.log('MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('Bağlantı başarılı.');

    // 1. Convert TS seedData file to temporary JS file
    console.log('Seed verileri yükleniyor...');
    const seedDataTsPath = path.join(__dirname, '..', 'src', 'lib', 'seedData.ts');
    if (!fs.existsSync(seedDataTsPath)) {
      throw new Error(`Seed dosyası bulunamadı: ${seedDataTsPath}`);
    }

    let seedTsContent = fs.readFileSync(seedDataTsPath, 'utf8');
    // Replace export statements to make it CommonJS compatible
    let seedJsContent = seedTsContent.replace(/export const/g, 'const');
    // Append module exports
    seedJsContent += '\nmodule.exports = { defaultPrayers, defaultRules, defaultPlaces };\n';

    fs.writeFileSync(tempPath, seedJsContent, 'utf8');

    // Require the temporary seed file
    const { defaultPrayers, defaultRules, defaultPlaces } = require('./tempSeedData');

    // 2. Clear and update prayers
    console.log('\n[1/3] Dualar güncelleniyor...');
    const oldPrayersCount = await Prayer.countDocuments();
    await Prayer.deleteMany({});
    const prayersResult = await Prayer.insertMany(defaultPrayers);
    console.log(`${oldPrayersCount} eski dua silindi, ${prayersResult.length} yeni dua yüklendi.`);

    // 3. Clear and update rules (yasaklar)
    console.log('\n[2/3] İhram Yasakları güncelleniyor...');
    const oldRulesCount = await Rule.countDocuments();
    await Rule.deleteMany({});
    const rulesResult = await Rule.insertMany(defaultRules);
    console.log(`${oldRulesCount} eski yasak silindi, ${rulesResult.length} yeni yasak yüklendi.`);

    // 4. Clear and update places (ziyaret yerleri)
    console.log('\n[3/3] Ziyaret Yerleri güncelleniyor...');
    const oldPlacesCount = await Place.countDocuments();
    await Place.deleteMany({});
    const placesResult = await Place.insertMany(defaultPlaces);
    console.log(`${oldPlacesCount} eski ziyaret yeri silindi, ${placesResult.length} yeni ziyaret yeri yüklendi.`);

    console.log('\nBütün veriler başarıyla MongoDB veritabanına aktarıldı.');
    process.exit(0);
  } catch (error) {
    console.error('İçe aktarma sırasında hata oluştu:', error);
    process.exit(1);
  } finally {
    // Cleanup temporary file
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (err) {
        console.warn('Geçici dosya silinemedi:', err);
      }
    }
  }
}

run();
