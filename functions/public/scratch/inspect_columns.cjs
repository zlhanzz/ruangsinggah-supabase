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

async function inspectColumns() {
  console.log("Fetching columns for survey_requests...");
  
  // We can query the database columns using the information_schema via a postgres function if it exists,
  // or we can try to do a postgrest select on the schema.
  // Wait, let's try calling a generic query if possible, or try a system table select if exposed,
  // otherwise, we can try to fetch the OpenAPI schema from Supabase directly!
  // Yes! Postgrest exposes the OpenAPI spec at the root URL!
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/?apikey=${env.SUPABASE_SERVICE_ROLE_KEY}`);
    const schema = await res.json();
    const surveyRequestsDef = schema.definitions.survey_requests;
    if (surveyRequestsDef && surveyRequestsDef.properties) {
      console.log("Columns in survey_requests:");
      console.log(Object.keys(surveyRequestsDef.properties).join(', '));
      console.log("\nDetails:", JSON.stringify(surveyRequestsDef.properties, null, 2));
    } else {
      console.log("Could not find definition for survey_requests in OpenAPI schema.");
    }
  } catch (err) {
    console.error("Error fetching schema:", err);
  }
}

inspectColumns();
