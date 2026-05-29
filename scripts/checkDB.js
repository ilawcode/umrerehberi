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

const MONGODB_URI = process.env.MONGODB_URI;

// Schema and Model definition
const PrayerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  arabic: { type: String, required: true },
  transliteration: { type: String, required: true },
  translation: { type: String, required: true },
  category: { 
    type: String, 
    required: true 
  },
  order: { type: Number, default: 0 },
});

const Prayer = mongoose.models.Prayer || mongoose.model('Prayer', PrayerSchema);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const count = await Prayer.countDocuments({});
    console.log(`Total prayers count in MongoDB: ${count}`);

    const categories = await Prayer.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    console.log('Categories overview:', categories);

    const risalePrayers = await Prayer.find({ category: 'risale' }).sort({ order: 1 });
    console.log('\n--- Risale-i Nur Prayers stored in MongoDB ---');
    risalePrayers.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} (Order: ${p.order})`);
    });
    console.log('-----------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error querying DB:', error);
    process.exit(1);
  }
}

run();
