const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

async function run() {
  const imageUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co/storage/v1/object/public/survey-photos/ktp/072aa5ae-eea2-49b7-9865-a2da582d0acc-0.39779102413875855.png";
  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(path.join(__dirname, 'downloaded_ktp.png'), Buffer.from(buffer));
  console.log("Image downloaded to functions/scratch/downloaded_ktp.png");
}
run();
