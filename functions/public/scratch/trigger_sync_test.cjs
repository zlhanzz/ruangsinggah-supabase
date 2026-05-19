const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const normalizePhone = (p) => {
    if (!p || p === '-') return '-';
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = clean.substring(1);
    if (clean.startsWith('62')) clean = clean.substring(2);
    return `+62${clean}`;
};

async function syncTransaction(transactionId) {
  console.log(`Syncing Transaction ID: ${transactionId}...`);
  const { data: trx, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

  if (fetchErr || !trx) {
      console.error("Transaction not found:", fetchErr);
      return;
  }

  const meta = trx.metadata || {};
  const kostList = Array.isArray(meta.kostList) && meta.kostList.length > 0
      ? meta.kostList
      : [{
          kostName: meta.kostName || meta.title || 'Kost Terdaftar',
          kostAddress: meta.kostAddress || meta.address || '-',
          ownerPhone: meta.ownerPhone || meta.owner_phone || '-',
      }];

  const { data: existingRecords } = await supabase
      .from('survey_requests')
      .select('*')
      .eq('transaction_id', transactionId);

  const sortedExisting = existingRecords 
      ? [...existingRecords].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      : [];

  for (let i = 0; i < kostList.length; i++) {
      const kost = kostList[i];
      const existing = sortedExisting[i] || null;

      const currentStatus = (existing?.status || 'AWAITING_PAYMENT').toUpperCase();
      let targetStatus = 'PENDING_ASSIGNMENT';
      if (existing && currentStatus !== 'AWAITING_PAYMENT') {
          targetStatus = existing.status;
      }

      const payload = {
          user_id: trx.user_id,
          transaction_id: transactionId,
          status: targetStatus,
          kost_name: kost.kostName || `Kost #${i + 1}`,
          kost_address: kost.kostAddress || '-',
          owner_phone: normalizePhone(kost.ownerPhone || kost.owner_phone || ''),
          survey_date: meta.surveyDate || existing?.survey_date || new Date().toISOString().split('T')[0],
          survey_time: meta.surveyTime || existing?.survey_time || '10:00',
          notes: meta.notes || existing?.notes || '',
          updated_at: new Date().toISOString(),
      };

      if (existing) {
          console.log(`Updating existing survey request: ${existing.id}`);
          const { error: updateErr } = await supabase
              .from('survey_requests')
              .update(payload)
              .eq('id', existing.id);
          if (updateErr) console.error("Update error:", updateErr);
      } else {
          console.log(`Creating new survey request for: ${kost.kostName}`);
          payload.created_at = trx.created_at || new Date().toISOString();
          const { error: insertErr } = await supabase
              .from('survey_requests')
              .insert([payload]);
          if (insertErr) console.error("Insert error:", insertErr);
      }
  }
}

async function run() {
  await syncTransaction('b2636fa4-7634-4ad2-8d0a-0d6f153cb13a');
  await syncTransaction('5d56b9be-9eed-4aaf-ad28-db6586719ab7');
  console.log("All sync runs finished.");
}

run();
