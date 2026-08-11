const fs = require('fs');
const path = require('path');

// 1. Update functions/public/supabase_schema.sql
const schemaFile = path.join(__dirname, '../public/supabase_schema.sql');
let schemaContent = fs.readFileSync(schemaFile, 'utf8');

const tableSql = `
-- ============================================================
-- TABEL KHUSUS MITRA KOST MANAGER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kostmanager_properties (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id          UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_uid            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title                TEXT,
  description          TEXT,
  price                NUMERIC(15,2) DEFAULT 0,
  facilities           JSONB DEFAULT '[]',
  address              TEXT,
  city                 TEXT,
  area                 TEXT,
  location             JSONB DEFAULT '{}',
  rules                JSONB DEFAULT '[]',
  campuses             JSONB DEFAULT '[]',
  image_urls           JSONB DEFAULT '[]',
  room_types           JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for the new table
ALTER TABLE public.kostmanager_properties ENABLE ROW LEVEL SECURITY;

-- Simple policies for kostmanager_properties
CREATE POLICY "Allow read for all users" ON public.kostmanager_properties
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations for admins" ON public.kostmanager_properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND (users.is_admin = true OR users.role = 'admin')
    )
  );

CREATE POLICY "Allow insert/update for survey agents" ON public.kostmanager_properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('survey_agent', 'agen', 'agent', 'admin')
    )
  );
`;

if (!schemaContent.includes('kostmanager_properties')) {
  schemaContent += tableSql;
  fs.writeFileSync(schemaFile, schemaContent, 'utf8');
  console.log("kostmanager_properties SQL table definition added to supabase_schema.sql.");
} else {
  console.log("kostmanager_properties table already exists in SQL schema.");
}

// 2. Update functions/public/pages/AgentDashboard.tsx submission handler
const dashboardFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let dashContent = fs.readFileSync(dashboardFile, 'utf8');

const targetStr = `            if (existingProp) {
                await supabase.from('properties').update(propertyPayload).eq('id', existingProp.id);
            } else {
                await supabase.from('properties').insert([propertyPayload]);
            }`;

const replacementStr = `            let savedProperty = null;
            if (existingProp) {
                const { data, error } = await supabase.from('properties').update(propertyPayload).eq('id', existingProp.id).select().maybeSingle();
                if (error) throw error;
                savedProperty = data;
            } else {
                const { data, error } = await supabase.from('properties').insert([propertyPayload]).select().maybeSingle();
                if (error) throw error;
                savedProperty = data;
            }

            // Save to dedicated kostmanager_properties table for mitra kost manager listings
            if (savedProperty) {
                const kmPropertyPayload = {
                    property_id: savedProperty.id,
                    owner_uid: isEditingKostManager.user_id,
                    title: propertyPayload.title,
                    description: propertyPayload.description,
                    price: propertyPayload.price,
                    facilities: propertyPayload.facilities,
                    address: propertyPayload.address,
                    city: propertyPayload.city,
                    area: propertyPayload.area,
                    location: propertyPayload.location,
                    rules: propertyPayload.rules,
                    campuses: propertyPayload.campuses,
                    image_urls: propertyPayload.image_urls,
                    room_types: propertyPayload.room_types
                };

                const { data: existingKmProp } = await supabase
                    .from('kostmanager_properties')
                    .select('id')
                    .eq('property_id', savedProperty.id)
                    .maybeSingle();

                if (existingKmProp) {
                    const { error } = await supabase.from('kostmanager_properties').update(kmPropertyPayload).eq('id', existingKmProp.id);
                    if (error) console.error("Error updating dedicated kostmanager_properties table:", error);
                } else {
                    const { error } = await supabase.from('kostmanager_properties').insert([kmPropertyPayload]);
                    if (error) console.error("Error inserting dedicated kostmanager_properties table:", error);
                }
            }`;

if (dashContent.includes(targetStr)) {
  dashContent = dashContent.replace(targetStr, replacementStr);
  fs.writeFileSync(dashboardFile, dashContent, 'utf8');
  console.log("AgentDashboard.tsx updated with dedicated kostmanager_properties writing.");
} else {
  console.error("Target submission block not found in AgentDashboard.tsx!");
}

console.log("Done.");
