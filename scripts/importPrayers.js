const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Function to load .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
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

// Schema and Model definition
const PrayerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  arabic: { type: String, required: true },
  transliteration: { type: String, required: true },
  translation: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['ihram', 'tawaf', 'say', 'general', 'visit'], 
    required: true 
  },
  order: { type: Number, default: 0 },
});

const Prayer = mongoose.models.Prayer || mongoose.model('Prayer', PrayerSchema);

async function run() {
  try {
    console.log('MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('Bağlantı başarılı.');

    const prayersPath = path.join(__dirname, '..', 'data', 'prayers.json');
    if (!fs.existsSync(prayersPath)) {
      throw new Error(`Dualar dosyası bulunamadı: ${prayersPath}`);
    }

    const prayersData = JSON.parse(fs.readFileSync(prayersPath, 'utf8'));
    console.log(`JSON dosyasında ${prayersData.length} adet dua bulundu.`);

    console.log('Mevcut dualar temizleniyor...');
    const deleteResult = await Prayer.deleteMany({});
    console.log(`${deleteResult.deletedCount} adet eski dua temizlendi.`);

    console.log('Yeni dualar veritabanına ekleniyor...');
    const insertResult = await Prayer.insertMany(prayersData);
    console.log(`${insertResult.length} adet yeni dua başarıyla eklendi.`);

    console.log('İşlem tamamlandı.');
    process.exit(0);
  } catch (error) {
    console.error('İçe aktarma sırasında hata oluştu:', error);
    process.exit(1);
  }
}

run();
