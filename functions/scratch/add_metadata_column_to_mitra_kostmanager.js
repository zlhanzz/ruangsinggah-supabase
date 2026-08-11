const fs = require('fs');
const path = require('path');

const schemaFile = path.join(__dirname, '../public/supabase_schema.sql');
let schemaContent = fs.readFileSync(schemaFile, 'utf8');

// 1. Add metadata JSONB column to mitra_kostmanager table schema in supabase_schema.sql
const targetTableDef = `CREATE TABLE IF NOT EXISTS public.mitra_kostmanager (
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
  room_types           JSONB DEFAULT '[]',`;

const replacementTableDef = `CREATE TABLE IF NOT EXISTS public.mitra_kostmanager (
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
  metadata             JSONB DEFAULT '{}',`;

if (schemaContent.includes(targetTableDef)) {
  schemaContent = schemaContent.replace(targetTableDef, replacementTableDef);
  fs.writeFileSync(schemaFile, schemaContent, 'utf8');
  console.log("metadata column added to mitra_kostmanager table definition in supabase_schema.sql.");
}

// 2. Update AgentDashboard.tsx to save publicBathroomFacilities to metadata JSONB field
const dashboardFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let dashContent = fs.readFileSync(dashboardFile, 'utf8');

dashContent = dashContent.replace(/\r\n/g, '\n');

// Update propertyPayload to include metadata
const oldPayload = `                image_urls: (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),
                campuses: kmListingForm.campuses
            };`;

const newPayload = `                image_urls: (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),
                campuses: kmListingForm.campuses,
                metadata: {
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || []
                }
            };`;

if (dashContent.includes(oldPayload)) {
  dashContent = dashContent.replace(oldPayload, newPayload);
  console.log("propertyPayload updated with metadata field.");
}

// Update kmPropertyPayload to include metadata
const oldKmPayload = `                const kmPropertyPayload = {
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
                };`;

const newKmPayload = `                const kmPropertyPayload = {
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
                    room_types: propertyPayload.room_types,
                    metadata: {
                        publicBathroomFacilities: kmListingForm.publicBathroomFacilities || []
                    }
                };`;

if (dashContent.includes(oldKmPayload)) {
  dashContent = dashContent.replace(oldKmPayload, newKmPayload);
  console.log("kmPropertyPayload updated with metadata field.");
}

// Convert back to CRLF
dashContent = dashContent.replace(/\n/g, '\r\n');
fs.writeFileSync(dashboardFile, dashContent, 'utf8');

console.log("Done.");
