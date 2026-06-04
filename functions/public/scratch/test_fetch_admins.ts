import { supabase } from '../supabase';

async function testFetch() {
  try {
    const { data, error } = await supabase.from('users').select('id, name, full_name, email, role, is_admin');
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    console.log("Total users:", data.length);
    const admins = data.filter(u => u.role === 'admin' || u.is_admin === true || u.is_admin === 1);
    console.log("Admins found:", admins);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testFetch();
