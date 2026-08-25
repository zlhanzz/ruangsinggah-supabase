const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/components/admin/KostManagerManagement.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

const kelolaBtnSearch = lines.findIndex((l, idx) => 
  l.includes('onClick={() => {') && 
  lines[idx + 1] && 
  lines[idx + 1].includes('setEditingRequest(req);')
);

if (kelolaBtnSearch !== -1) {
  let endIdx = kelolaBtnSearch;
  while (endIdx < lines.length && !lines[endIdx].includes('className="px-3 py-1.5 rounded-lg')) {
    endIdx++;
  }
  
  const startLine = kelolaBtnSearch;
  const endLine = endIdx - 1;
  
  console.log(`Replacing Kelola button onClick handler from line ${startLine + 1} to ${endLine + 1} to add logging.`);

  const kelolaBtnReplacement = `                                                    onClick={async () => {
                                                        setEditingRequest(req);
                                                        setEditForm({
                                                            status: req.status,
                                                            assigned_agent_id: req.assigned_agent_id || '',
                                                            result_drive_link: req.result_drive_link || ''
                                                        });
                                                        setShowReviewAccordion(false);
                                                        
                                                        setLoadingProperty(true);
                                                        console.log("[KostManagerReview] Clicked Kelola for request:", req);
                                                        try {
                                                            let propertyId = req.property_id;
                                                            let propData = null;

                                                            // 1. Try fetching from mitra_kostmanager using property_id
                                                            if (propertyId) {
                                                                console.log("[KostManagerReview] Fetching via propertyId:", propertyId);
                                                                const { data, error } = await supabase
                                                                    .from('mitra_kostmanager')
                                                                    .select('*')
                                                                    .eq('property_id', propertyId)
                                                                    .maybeSingle();
                                                                if (error) console.error("[KostManagerReview] Step 1 Error:", error);
                                                                propData = data;
                                                            }

                                                            // 2. Fallback: Try fetching from mitra_kostmanager using owner_uid
                                                            if (!propData && req.user_id) {
                                                                console.log("[KostManagerReview] Fallback: Fetching via owner_uid (req.user_id):", req.user_id);
                                                                const { data, error } = await supabase
                                                                    .from('mitra_kostmanager')
                                                                    .select('*')
                                                                    .eq('owner_uid', req.user_id)
                                                                    .limit(1)
                                                                    .maybeSingle();
                                                                if (error) console.error("[KostManagerReview] Step 2 Error:", error);
                                                                propData = data;
                                                                if (propData && propData.property_id) {
                                                                    propertyId = propData.property_id;
                                                                }
                                                            }

                                                            // 3. Ultra Fallback: Try fetching from properties table
                                                            if (!propData && req.user_id) {
                                                                console.log("[KostManagerReview] Ultra Fallback: Fetching via properties table...");
                                                                const { data, error } = await supabase
                                                                    .from('properties')
                                                                    .select('*')
                                                                    .eq('owner_uid', req.user_id)
                                                                    .eq('is_managed', true)
                                                                    .limit(1)
                                                                    .maybeSingle();
                                                                if (error) console.error("[KostManagerReview] Step 3 Error:", error);
                                                                propData = data;
                                                            }

                                                            console.log("[KostManagerReview] Final loaded property details:", propData);
                                                            setSelectedPropertyDetails(propData);
                                                        } catch (err) {
                                                            console.error("[KostManagerReview] Exception loading property details:", err);
                                                            setSelectedPropertyDetails(null);
                                                        } finally {
                                                            setLoadingProperty(false);
                                                        }
                                                    }}`;

  lines.splice(startLine, (endLine - startLine) + 1, kelolaBtnReplacement);
  console.log("Kelola button onClick handler modified successfully.");
} else {
  console.error("CRITICAL: Kelola button onClick pattern not found!");
}

const finalContent = lines.join('\n');

// Convert back to CRLF
content = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
