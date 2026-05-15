const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function runScraper() {
  try {
    console.log("Memulai scraping...");
    const response = await axios.get('https://dracinzek.vercel.app/api/melolo/trending');
    const dramas = response.data;

    if (!Array.isArray(dramas) || dramas.length === 0) {
      console.log("Tidak ada data yang diterima dari API.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    dramas.forEach((drama) => {
      if (!drama || !drama.title) {
        console.warn("Melewati item tanpa title:", JSON.stringify(drama));
        return;
      }

      const docId = drama.title.replace(/\s+/g, '-').toLowerCase();
      const docRef = db.collection('dramas').doc(docId);
      batch.set(docRef, {
        title: drama.title,
        cover: drama.cover || null,
        author: drama.author || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      count++;
    });

    await batch.commit();
    console.log(`Berhasil menyimpan ${count} drama.`);
  } catch (error) {
    console.error("Scraper Error:", error.message);
    process.exit(1);
  }
}

runScraper();
