const admin = require('firebase-admin');
const axios = require('axios');

// Inisialisasi Firebase menggunakan Service Account dari GitHub Secrets
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

    const batch = db.batch();
    dramas.forEach((drama) => {
      const docId = drama.title.replace(/\s+/g, '-').toLowerCase();
      const docRef = db.collection('dramas').doc(docId);
      batch.set(docRef, {
        title: drama.title,
        cover: drama.cover,
        author: drama.author,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await batch.commit();
    console.log(`Berhasil menyimpan ${dramas.length} drama.`);
  } catch (error) {
    console.error("Scraper Error:", error.message);
    process.exit(1);
  }
}

runScraper();
