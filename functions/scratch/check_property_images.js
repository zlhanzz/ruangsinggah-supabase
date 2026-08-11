const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sgcmnsnokrztocnhxnqm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos');

async function check() {
  const { data, error } = await supabase
    .from('properties')
    .select('title, image_urls')
    .eq('title', 'kost madani')
    .limit(5);
  
  if (error) {
    console.error(error);
    return;
  }
  console.log("Kost Madani image_urls:");
  data.forEach((p, idx) => {
    console.log(`${idx+1}. Title: "${p.title}" -> image_urls:`, p.image_urls);
  });
}

check();
