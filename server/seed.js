const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB, disconnectDB } = require('./src/config/db');
const { populateSeedData } = require('./src/utils/seedHelper');

const DEVICE_ID = process.env.DEFAULT_DEVICE_ID || 'esp32-lamp-01';

async function runSeed() {
  console.log(`🌱 Running seed script for device: ${DEVICE_ID}...`);
  await connectDB();
  await populateSeedData(DEVICE_ID, true);
  await disconnectDB();
  console.log('Seed completed successfully.');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed script error:', err);
      process.exit(1);
    });
}

module.exports = runSeed;
