
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Testing Full Join Query...");
    const { data, error } = await supabase.from('resident_status').select(`
        *,
        user:user_id (
            full_name,
            photo_url,
            phone
        ),
        property:kost_id (
            title,
            address,
            city,
            area,
            image_urls
        )
    `).limit(1);
    
    if (error) {
        console.log("Join Error:", error);
    } else {
        console.log("Join Data:", JSON.stringify(data, null, 2));
    }
}
check();
