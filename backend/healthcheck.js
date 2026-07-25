#!/usr/bin/env node

/**
 * নুরুল কোরআন মাদরাসা — Backend Health Check
 * 
 * সার্ভার সুস্থ আছে কিনা যাচাই করার জন্য চালান:
 *   node healthcheck.js
 */

const http = require('http');

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api/health`;

console.log(`\n🏥 Backend স্বাস্থ্য পরীক্ষা শুরু হচ্ছে...\n`);
console.log(`📍 পরীক্ষা করছি: ${API_URL}\n`);

const req = http.get(API_URL, { timeout: 5000 }, (res) => {
  console.log(`✅ সার্ভার সাড়া দিয়েছে: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`📊 ডাটাবেস স্থিতি: ${json.db === 'connected' ? '✅ সংযুক্ত' : '❌ বিচ্ছিন্ন'}`);
      console.log(`\n✨ সবকিছু সঠিক আছে!\n`);
      process.exit(0);
    } catch (e) {
      console.error('❌ Response parse ব্যর্থ:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(`❌ সংযোগ ব্যর্থ: ${err.message}`);
  console.error(`\n💡 নিশ্চিত করুন:`);
  console.error(`   1. Backend সার্ভার চলছে: npm start`);
  console.error(`   2. পোর্ট ${PORT} সঠিক (.env এ PORT)`);
  console.error(`   3. MONGODB_URI সেট করা হয়েছে\n`);
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  console.error(`❌ অনুরোধ সময়সীমা অতিক্রম করেছে`);
  process.exit(1);
});
