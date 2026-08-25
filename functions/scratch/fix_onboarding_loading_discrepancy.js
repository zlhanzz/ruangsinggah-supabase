const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
code = code.replace(/\r\n/g, '\n');

// 1. Replace mitra_kostmanager table lookup fallback
const target1 = `            // 1. Try fetching from dedicated mitra_kostmanager table first (bypass RLS draft restriction)
            let kmProp = null;
            let kmQuery = supabase.from('mitra_kostmanager').select('*');
            if (propertyIdToFetch) {
                kmQuery = kmQuery.eq('property_id', propertyIdToFetch);
            } else {
                kmQuery = kmQuery.eq('owner_uid', req.user_id);
            }
            const { data: kmProps } = await kmQuery.limit(1);
            if (kmProps && kmProps.length > 0) {
                kmProp = kmProps[0];
            }`;

const replacement1 = `            // 1. Try fetching from dedicated mitra_kostmanager table first (bypass RLS draft restriction)
            let kmProp = null;
            if (propertyIdToFetch) {
                const { data: kmProps } = await supabase
                    .from('mitra_kostmanager')
                    .select('*')
                    .eq('property_id', propertyIdToFetch)
                    .limit(1);
                if (kmProps && kmProps.length > 0) {
                    kmProp = kmProps[0];
                }
            }`;

// 2. Replace properties table lookup fallback
const target2 = `            // 2. Fallback to properties table if no dedicated mitra_kostmanager record exists yet
            let query2 = supabase.from('properties').select('*');
            const uuidPat3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            let canQueryProperties = false;
            if (propertyIdToFetch) {
                query2 = query2.eq('id', propertyIdToFetch);
                canQueryProperties = true;
            } else if (req.user_id && uuidPat3.test(req.user_id)) {
                query2 = query2.eq('owner_uid', req.user_id);
                canQueryProperties = true;
            } else {
                console.warn('openKostManagerListing: no valid UUID for properties lookup, will use req data as fallback.');
            }
            
            const { data: existingProps, error } = canQueryProperties
                ? await query2
                : { data: null, error: null };`;

const replacement2 = `            // 2. Fallback to properties table if no dedicated mitra_kostmanager record exists yet
            let query2 = supabase.from('properties').select('*');
            const uuidPat3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            let canQueryProperties = false;
            if (propertyIdToFetch && uuidPat3.test(propertyIdToFetch)) {
                query2 = query2.eq('id', propertyIdToFetch);
                canQueryProperties = true;
            } else {
                console.log('openKostManagerListing: new property pendaftaran (propertyIdToFetch is empty), skipping properties database query lookup.');
            }
            
            const { data: existingProps, error } = canQueryProperties
                ? await query2
                : { data: null, error: null };`;

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
    console.log("1. mitra_kostmanager fetch fallback updated successfully.");
} else {
    console.error("ERROR 1: Target 1 not found!");
}

if (code.includes(target2)) {
    code = code.replace(target2, replacement2);
    console.log("2. properties fetch fallback updated successfully.");
} else {
    console.error("ERROR 2: Target 2 not found!");
}

// Convert back to CRLF
code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, code, 'utf8');
console.log("fix_onboarding_loading_discrepancy logic completed.");
