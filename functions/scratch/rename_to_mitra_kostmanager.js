const fs = require('fs');
const path = require('path');

// 1. Update functions/public/supabase_schema.sql
const schemaFile = path.join(__dirname, '../public/supabase_schema.sql');
let schemaContent = fs.readFileSync(schemaFile, 'utf8');

// Replace all occurrences of kostmanager_properties with rent_kostmanager or mitra_kostmanager
schemaContent = schemaContent.replace(/kostmanager_properties/g, 'mitra_kostmanager');
fs.writeFileSync(schemaFile, schemaContent, 'utf8');
console.log("Renamed table to public.mitra_kostmanager in supabase_schema.sql.");

// 2. Update functions/public/pages/AgentDashboard.tsx
const dashboardFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let dashContent = fs.readFileSync(dashboardFile, 'utf8');

dashContent = dashContent.replace(/kostmanager_properties/g, 'mitra_kostmanager');
fs.writeFileSync(dashboardFile, dashContent, 'utf8');
console.log("Renamed table to public.mitra_kostmanager in AgentDashboard.tsx.");

console.log("Done.");
