const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  const imageUrl = "https://sgcmnsnokrztocnhxnqm.supabase.co/storage/v1/object/public/survey-photos/ktp/c58e7306-d657-420a-9435-91f5fbd1a3a0-0.9574989876837738.png";
  const res = await fetch(imageUrl);
  console.log("Status:", res.status);
  console.log("Content-Length:", res.headers.get("content-length"));
}
run();
