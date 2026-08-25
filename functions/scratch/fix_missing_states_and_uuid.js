const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');

// ============================================================
// FIX 1: Add isExistingPropertyMigration and warningAccepted state variables
// ============================================================

// Find the line with isExistingPropertyMigration to check if already declared
const hasExisting = code.includes('const [isExistingPropertyMigration');
const hasWarning = code.includes('const [warningAccepted');

if (!hasExisting || !hasWarning) {
    // Find a good insertion point: after kmActiveTab state
    let insertIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("useState<'info' | 'rooms'>('info')")) {
            insertIdx = i;
            break;
        }
    }

    if (insertIdx === -1) {
        // Fallback: look for kmMapRef
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('const kmMapRef = useRef')) {
                insertIdx = i - 1;
                break;
            }
        }
    }

    if (insertIdx > -1) {
        const toInsert = [];
        if (!hasExisting) {
            toInsert.push('    const [isExistingPropertyMigration, setIsExistingPropertyMigration] = useState(false);');
        }
        if (!hasWarning) {
            toInsert.push('    const [warningAccepted, setWarningAccepted] = useState(false);');
        }
        lines.splice(insertIdx + 1, 0, ...toInsert);
        console.log(`State variables added after line ${insertIdx + 1}.`);
    } else {
        console.error('Could not find insertion point for state variables!');
    }
} else {
    console.log('State variables already declared, skipping.');
}

code = lines.join('\n');

// ============================================================
// FIX 2: Reset isExistingPropertyMigration and warningAccepted in closeKostManagerListing
// ============================================================
const closeTarget = `        setSearchParams({ status: agentTab });
    };`;
const closeReplacement = `        setSearchParams({ status: agentTab });
        setIsExistingPropertyMigration(false);
        setWarningAccepted(false);
    };`;

if (code.includes(closeTarget) && !code.includes('setIsExistingPropertyMigration(false);')) {
    code = code.replace(closeTarget, closeReplacement);
    console.log('Reset states added to closeKostManagerListing.');
} else if (code.includes('setIsExistingPropertyMigration(false);')) {
    console.log('Reset already present in closeKostManagerListing.');
} else {
    console.error('Could not find closeKostManagerListing reset target!');
}

// ============================================================
// FIX 3: Set isExistingPropertyMigration=true when existingProp found
// ============================================================
const existingPropSetTarget = `            if (existingProp) {
                console.log("openKostManagerListing: fallback to properties table:", existingProp.id);`;

const existingPropSetReplacement = `            if (existingProp) {
                setIsExistingPropertyMigration(true);
                setWarningAccepted(false);
                console.log("openKostManagerListing: fallback to properties table:", existingProp.id);`;

if (code.includes(existingPropSetTarget)) {
    code = code.replace(existingPropSetTarget, existingPropSetReplacement);
    console.log('setIsExistingPropertyMigration(true) added when existingProp found.');
} else if (code.includes('setIsExistingPropertyMigration(true)')) {
    console.log('setIsExistingPropertyMigration already set.');
} else {
    console.error('Could not find existingProp check target!');
}

// ============================================================
// FIX 4: UUID guard - validate propertyIdToFetch before using
// ============================================================
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Guard propertyIdToFetch assignment to validate UUID format
const uuidGuardTarget = `                if (trxData?.metadata?.propertyId) {
                    propertyIdToFetch = trxData.metadata.propertyId;
                    console.log("openKostManagerListing: found propertyId in transaction metadata:", propertyIdToFetch);
                }`;

const uuidGuardReplacement = `                const rawPropId = trxData?.metadata?.propertyId;
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (rawPropId && uuidPattern.test(rawPropId)) {
                    propertyIdToFetch = rawPropId;
                    console.log("openKostManagerListing: found valid propertyId in transaction metadata:", propertyIdToFetch);
                } else if (rawPropId) {
                    console.warn("openKostManagerListing: propertyId in metadata is not a valid UUID, ignoring:", rawPropId);
                }`;

if (code.includes(uuidGuardTarget)) {
    code = code.replace(uuidGuardTarget, uuidGuardReplacement);
    console.log('UUID validation guard added to propertyIdToFetch.');
} else if (code.includes('uuidPattern')) {
    console.log('UUID guard already present.');
} else {
    console.error('Could not find UUID guard target!');
}

// ============================================================
// FIX 5: Suppress 'skip_draft_fetch' from appearing as console.error
// ============================================================
const catchTarget = `        } catch (e) {
            console.error("Error pre-fetching room types for draft sanitization:", e);
        }`;
const catchReplacement = `        } catch (e: any) {
            if (e?.message !== 'skip_draft_fetch') {
                console.error("Error pre-fetching room types for draft sanitization:", e);
            }
        }`;

if (code.includes(catchTarget)) {
    code = code.replace(catchTarget, catchReplacement);
    console.log('Catch block updated to suppress skip_draft_fetch silently.');
} else if (code.includes("skip_draft_fetch")) {
    console.log('Catch block already updated.');
} else {
    console.error('Could not find catch block target!');
}

// ============================================================
// FIX 6: UUID guard for early draft fetch properties query (L846)
// ============================================================
const earlyPropertiesQueryTarget = `            let query = supabase.from('properties').select('id');
            if (propertyIdToFetch) {
                query = query.eq('id', propertyIdToFetch);
            } else {
                query = query.eq('owner_uid', req.user_id);
            }`;

const earlyPropertiesQueryReplacement = `            let query = supabase.from('properties').select('id');
            const uuidPatDraft = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (propertyIdToFetch) {
                query = query.eq('id', propertyIdToFetch);
            } else if (req.user_id && uuidPatDraft.test(req.user_id)) {
                query = query.eq('owner_uid', req.user_id);
            } else {
                console.warn('openKostManagerListing: no valid propertyId or user_id for draft fetch, skipping.');
                throw new Error('skip_draft_fetch');
            }`;

if (code.includes(earlyPropertiesQueryTarget)) {
    code = code.replace(earlyPropertiesQueryTarget, earlyPropertiesQueryReplacement);
    console.log('UUID guard added to early draft properties query.');
} else if (code.includes('uuidPatDraft')) {
    console.log('UUID guard for early draft properties query already present.');
} else {
    console.error('Could not find early draft properties query target!');
}

// ============================================================
// FIX 7: UUID guard for fallback properties query (L990)
// ============================================================
const fallbackPropertiesQueryTarget = `            // 2. Fallback to properties table if no dedicated mitra_kostmanager record exists yet
            let query = supabase.from('properties').select('*');
            if (propertyIdToFetch) {
                query = query.eq('id', propertyIdToFetch);
            } else {
                query = query.eq('owner_uid', req.user_id);
            }
            
            const { data: existingProps, error } = await query;`;

const fallbackPropertiesQueryReplacement = `            // 2. Fallback to properties table if no dedicated mitra_kostmanager record exists yet
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

if (code.includes(fallbackPropertiesQueryTarget)) {
    code = code.replace(fallbackPropertiesQueryTarget, fallbackPropertiesQueryReplacement);
    console.log('UUID guard added to fallback properties query.');
} else if (code.includes('canQueryProperties')) {
    console.log('UUID guard for fallback properties query already present.');
} else {
    console.error('Could not find fallback properties query target!');
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log('\nAll fixes applied successfully.');
