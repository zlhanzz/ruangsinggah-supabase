const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

const startIndex = lines.findIndex((line, idx) => 
  line.includes("// Fetch existing property for this user to edit") && 
  lines[idx + 1] && 
  lines[idx + 1].includes("let query = supabase.from('properties').select('*');")
);

if (startIndex !== -1) {
  // Find the } catch (err) { line and its console.error + closing }
  let catchIdx = startIndex;
  while (catchIdx < lines.length && !lines[catchIdx].includes("console.error(\"Failed to fetch existing property details:\"")) {
    catchIdx++;
  }
  // catchIdx now points at console.error line. The } catch (err) { is one line before, and } is one line after.
  // We want to replace from startIndex up to and including the line with console.error (catchIdx),
  // plus the closing } on the line after (catchIdx+1).
  let endReplaceIdx = catchIdx + 1; // the } closing the catch block

  console.log(`Found database fallback loader starting at line ${startIndex + 1} and ending around ${endReplaceIdx + 1}`);

  const fallbackReplacement = `            // 1. Try fetching from dedicated mitra_kostmanager table first (bypass RLS draft restriction)
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
            }

            if (kmProp) {
                console.log("openKostManagerListing: found existing dedicated mitra_kostmanager to load:", kmProp.property_id);
                kmOriginalLocationRef.current = kmProp.location || null;
                
                const loadedCategories = ['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan'];
                if (kmProp.image_urls && Array.isArray(kmProp.image_urls)) {
                    kmProp.image_urls.forEach((img: any, idx: number) => {
                        let label = img.label || '';
                        if (label.toLowerCase() === 'area umum') {
                            label = 'Parkiran';
                        }
                        if (idx < 4) {
                            if (label) {
                                loadedCategories[idx] = label;
                            }
                        } else {
                            loadedCategories.push(label || \`Foto Lainnya \${idx - 3}\`);
                        }
                    });
                }
                setPhotoCategories(loadedCategories);
                setShowAddLandmarkForm(false);
                setActiveRoomIdx(null);
                setTemporaryRoom(null);

                setKmListingForm({
                    title: kmProp.title || req.kost_name,
                    description: kmProp.description || '',
                    address: kmProp.address || req.kost_address,
                    city: kmProp.city || 'Makassar',
                    area: kmProp.area || '',
                    type: kmProp.type || 'Campur',
                    price: kmProp.price || 0,
                    totalRooms: kmProp.total_rooms || 0,
                    owner_uid: req.user_id,
                    roomTypes: kmProp.room_types || [],
                    facilities: kmProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: kmProp.location || { lat: -5.147665, lng: 119.432731 },
                    rules: kmProp.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: kmProp.image_urls || [],
                    campuses: kmProp.campuses || [],
                    publicBathroomFacilities: kmProp.metadata?.publicBathroomFacilities || [],
                    publicKitchenFacilities: kmProp.metadata?.publicKitchenFacilities || []
                });
                return;
            }

            // 2. Fallback to properties table if no dedicated mitra_kostmanager record exists yet
            let query = supabase.from('properties').select('*');
            if (propertyIdToFetch) {
                query = query.eq('id', propertyIdToFetch);
            } else {
                query = query.eq('owner_uid', req.user_id);
            }
            
            const { data: existingProps, error } = await query;

            if (error) {
                console.error("Error fetching existing property:", error);
            }

            const existingProp = existingProps?.find(p => p.is_managed) || existingProps?.[0];

            if (existingProp) {
                console.log("openKostManagerListing: fallback to properties table:", existingProp.id);
                kmOriginalLocationRef.current = existingProp.location || null;
                
                const loadedCategories = ['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan'];
                if (existingProp.image_urls && Array.isArray(existingProp.image_urls)) {
                    existingProp.image_urls.forEach((img: any, idx: number) => {
                        let label = img.label || '';
                        if (label.toLowerCase() === 'area umum') {
                            label = 'Parkiran';
                        }
                        if (idx < 4) {
                            if (label) {
                                loadedCategories[idx] = label;
                            }
                        } else {
                            loadedCategories.push(label || \`Foto Lainnya \${idx - 3}\`);
                        }
                    });
                }
                setPhotoCategories(loadedCategories);
                setShowAddLandmarkForm(false);
                setActiveRoomIdx(null);
                setTemporaryRoom(null);

                setKmListingForm({
                    title: existingProp.title || req.kost_name,
                    description: existingProp.description || '',
                    address: existingProp.address || req.kost_address,
                    city: existingProp.city || 'Makassar',
                    area: existingProp.area || '',
                    type: existingProp.type || 'Campur',
                    price: existingProp.price || 0,
                    totalRooms: existingProp.total_rooms || 0,
                    owner_uid: req.user_id,
                    roomTypes: [],
                    facilities: existingProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: existingProp.location || { lat: -5.147665, lng: 119.432731 },
                    rules: existingProp.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: existingProp.image_urls || [],
                    campuses: existingProp.campuses || [],
                    publicBathroomFacilities: existingProp.metadata?.publicBathroomFacilities || [],
                    publicKitchenFacilities: existingProp.metadata?.publicKitchenFacilities || []
                });
                return;
            }
        } catch (err) {
            console.error("Failed to fetch existing property details:", err);
        }`;

  lines.splice(startIndex, (endReplaceIdx - startIndex) + 1, fallbackReplacement);
  console.log("Successfully updated openKostManagerListing to check mitra_kostmanager table first!");
} else {
  console.error("CRITICAL ERROR: properties fallback loader start not found!");
}

const finalContent = lines.join('\n');

// Convert back to CRLF
content = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
