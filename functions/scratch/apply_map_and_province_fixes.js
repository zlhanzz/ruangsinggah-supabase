const fs = require('fs');
const path = require('path');

// 1. Edit AgentDashboard.tsx
const agentDashboardPath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let agentCode = fs.readFileSync(agentDashboardPath, 'utf-8');

// A. Add reverseGeocodeAndApply and update handleConfirmModalLocation
const oldConfirmModalLocation = `    const handleConfirmModalLocation = () => {
        setKmListingForm(prev => ({
            ...prev,
            location: { lat: modalTempLocation.lat, lng: modalTempLocation.lng }
        }));
        
        const gw = (window as any).google;
        if (gw?.maps?.Geocoder) {
            const geocoder = new gw.maps.Geocoder();
            geocoder.geocode(
                { location: { lat: modalTempLocation.lat, lng: modalTempLocation.lng } },
                (results: any[], status: string) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const addr = results[0].formatted_address;
                        const components = results[0].address_components || [];
                        let city = '', area = '', province = '';
                        for (const comp of components) {
                            const types = comp.types || [];
                            if (types.includes('administrative_area_level_1') && !province) province = comp.long_name;
                            if (types.includes('administrative_area_level_2') && !city) city = comp.long_name;
                            if ((types.includes('administrative_area_level_3') || types.includes('sublocality_level_1') || types.includes('sublocality')) && !area) area = comp.long_name;
                            if (types.includes('locality') && !area && comp.long_name !== city) area = comp.long_name;
                        }
                        setKmListingForm(prev => {
                            const updates: any = { address: addr };
                            if (city) updates.city = city.replace(/^(Kota|Kabupaten|Kab\\.)\\s+/i, '').trim();
                            if (area) updates.area = area.replace(/^(Kecamatan|Kec\\.)\\s+/i, '').trim();
                            if (province) updates.province = province.replace(/^(Provinsi|Prov\\.)\\s+/i, '').trim();
                            return { ...prev, ...updates };
                        });
                    }
                }
            );
        }

        setIsMapModalOpen(false);
    };`;

const newConfirmModalLocation = `    const reverseGeocodeAndApply = (lat: number, lng: number, fallbackAddr?: string) => {
        setKmListingForm((prev: any) => ({
            ...prev,
            location: { lat, lng }
        }));
        if (kmMarkerInstance.current) kmMarkerInstance.current.setPosition({ lat, lng });
        if (kmMapInstance.current) kmMapInstance.current.panTo({ lat, lng });

        const gw = (window as any).google;
        if (gw?.maps?.Geocoder) {
            const geocoder = new gw.maps.Geocoder();
            geocoder.geocode(
                { location: { lat, lng } },
                (results: any[], status: string) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const addr = results[0].formatted_address;
                        const components = results[0].address_components || [];
                        let city = '', area = '', province = '';
                        for (const comp of components) {
                            const types = comp.types || [];
                            if (types.includes('administrative_area_level_1') && !province) province = comp.long_name;
                            if (types.includes('administrative_area_level_2') && !city) city = comp.long_name;
                            if ((types.includes('administrative_area_level_3') || types.includes('sublocality_level_1') || types.includes('sublocality')) && !area) area = comp.long_name;
                            if (types.includes('locality') && !area && comp.long_name !== city) area = comp.long_name;
                        }
                        setKmListingForm((prev: any) => {
                            const updates: any = { address: addr || prev.address || fallbackAddr };
                            if (city) updates.city = city.replace(/^(Kota|Kabupaten|Kab\\.)\\s+/i, '').trim();
                            if (area) updates.area = area.replace(/^(Kecamatan|Kec\\.)\\s+/i, '').trim();
                            if (province) updates.province = province.replace(/^(Provinsi|Prov\\.)\\s+/i, '').trim();
                            return { ...prev, ...updates };
                        });
                    }
                }
            );
        }
    };

    const handleConfirmModalLocation = () => {
        reverseGeocodeAndApply(modalTempLocation.lat, modalTempLocation.lng);
        setIsMapModalOpen(false);
    };`;

if (agentCode.includes(oldConfirmModalLocation)) {
    agentCode = agentCode.replace(oldConfirmModalLocation, newConfirmModalLocation);
    console.log('Replaced handleConfirmModalLocation and added reverseGeocodeAndApply');
} else {
    console.warn('Could not find exact oldConfirmModalLocation');
}

// B. Update mini map listeners
const oldMiniMapListeners = `            map.addListener('click', (e: any) => {
                const clickLat = e.latLng.lat();
                const clickLng = e.latLng.lng();
                setPendingLocationChange({ lat: clickLat, lng: clickLng });
            });

            marker.addListener('dragend', () => {
                const pos = marker.getPosition();
                if (pos) {
                    setPendingLocationChange({ lat: pos.lat(), lng: pos.lng() });
                    if (kmListingForm.location) {
                        marker.setPosition({ lat: kmListingForm.location.lat, lng: kmListingForm.location.lng });
                    }
                }
            });`;

const newMiniMapListeners = `            map.addListener('click', (e: any) => {
                const clickLat = e.latLng.lat();
                const clickLng = e.latLng.lng();
                marker.setPosition({ lat: clickLat, lng: clickLng });
                reverseGeocodeAndApply(clickLat, clickLng);
            });

            marker.addListener('dragend', () => {
                const pos = marker.getPosition();
                if (pos) {
                    reverseGeocodeAndApply(pos.lat(), pos.lng());
                }
            });`;

if (agentCode.includes(oldMiniMapListeners)) {
    agentCode = agentCode.replace(oldMiniMapListeners, newMiniMapListeners);
    console.log('Replaced oldMiniMapListeners with real-time reverseGeocodeAndApply');
} else {
    console.warn('Could not find exact oldMiniMapListeners');
}

// C. Update GPS button
const oldGpsButton = `                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (confirmLocationChange()) {
                                                                    if (navigator.geolocation) {
                                                                        navigator.geolocation.getCurrentPosition((pos) => {
                                                                            const plat = pos.coords.latitude;
                                                                            const plng = pos.coords.longitude;
                                                                            setKmListingForm(prev => ({
                                                                                ...prev,
                                                                                location: { lat: plat, lng: plng }
                                                                            }));
                                                                            const gw = (window as any).google;
                                                                            if (gw?.maps?.Geocoder) {
                                                                                const geocoder = new gw.maps.Geocoder();
                                                                                geocoder.geocode({ location: { lat: plat, lng: plng } }, (results: any[], status: string) => {
                                                                                    if (status === 'OK' && results && results.length > 0) {
                                                                                        const addr = results[0].formatted_address;
                                                                                        const components = results[0].address_components || [];
                                                                                        let city = '', area = '', province = '';
                                                                                        for (const comp of components) {
                                                                                            const types = comp.types || [];
                                                                                            if (types.includes('administrative_area_level_1') && !province) province = comp.long_name;
                                                                                            if (types.includes('administrative_area_level_2') && !city) city = comp.long_name;
                                                                                            if ((types.includes('administrative_area_level_3') || types.includes('sublocality_level_1') || types.includes('sublocality')) && !area) area = comp.long_name;
                                                                                            if (types.includes('locality') && !area && comp.long_name !== city) area = comp.long_name;
                                                                                        }
                                                                                        setKmListingForm(prev => ({
                                                                                            ...prev,
                                                                                            address: addr,
                                                                                            city: city.replace(/^(Kota|Kabupaten|Kab\\.)\\s+/i, '').trim(),
                                                                                            area: area.replace(/^(Kecamatan|Kec\\.)\\s+/i, '').trim(),
                                                                                            province: province.replace(/^(Provinsi|Prov\\.)\\s+/i, '').trim()
                                                                                        }));
                                                                                    }
                                                                                });
                                                                            }
                                                                            alert('Koordinat properti presisi berhasil dikunci & wilayah terdeteksi!');
                                                                        }, err => alert('Gagal membaca GPS: ' + err.message));
                                                                    }
                                                                }
                                                            }}`;

const newGpsButton = `                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (confirmLocationChange()) {
                                                                    if (navigator.geolocation) {
                                                                        navigator.geolocation.getCurrentPosition((pos) => {
                                                                            const plat = pos.coords.latitude;
                                                                            const plng = pos.coords.longitude;
                                                                            reverseGeocodeAndApply(plat, plng);
                                                                            alert('Koordinat properti presisi berhasil dikunci & wilayah terdeteksi!');
                                                                        }, err => alert('Gagal membaca GPS: ' + err.message));
                                                                    }
                                                                }
                                                            }}`;

if (agentCode.includes(oldGpsButton)) {
    agentCode = agentCode.replace(oldGpsButton, newGpsButton);
    console.log('Replaced oldGpsButton');
} else {
    console.warn('Could not find exact oldGpsButton');
}

// D. Fix handleSaveDraftDirectly propertyPayload
const oldDraftPayload = `            const propertyPayload = {
                title: currentForm.title,
                description: currentForm.description,
                address: currentForm.address,
                city: currentForm.city,
                area: currentForm.area,
                province: currentForm.province || '',
                type: currentForm.type,
                price: finalPrice,
                owner_uid: validOwnerUid,
                mitra_id: validOwnerUid, // Add valid mitra_id for not-null DB constraint
                room_types: currentForm.roomTypes,
                status: 'draft',
                is_managed: true,
                facilities: currentForm.facilities,
                location: currentForm.location,
                rules: currentForm.rules,
                image_urls: (currentForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),
                campuses: currentForm.campuses,
                metadata: {
                    publicParkingFacilities: kmListingForm.publicParkingFacilities || [],
                    publicKitchenFacilities: kmListingForm.publicKitchenFacilities || [],
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    addressNotes: kmListingForm.addressNotes || '',
                    signature_data: signatureData || null,
                    agreed_to_terms: agreedToTerms
                }
            };`;

const newDraftPayload = `            const propertyPayload = {
                title: currentForm.title,
                description: currentForm.description,
                address: currentForm.address,
                city: currentForm.city,
                area: currentForm.area,
                type: currentForm.type,
                price: finalPrice,
                owner_uid: validOwnerUid,
                mitra_id: validOwnerUid, // Add valid mitra_id for not-null DB constraint
                room_types: currentForm.roomTypes,
                status: 'draft',
                is_managed: true,
                facilities: currentForm.facilities,
                location: currentForm.location,
                rules: currentForm.rules,
                image_urls: (currentForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),
                campuses: currentForm.campuses,
                metadata: {
                    province: currentForm.province || '',
                    publicParkingFacilities: currentForm.publicParkingFacilities || kmListingForm.publicParkingFacilities || ['Parkir Motor'],
                    publicKitchenFacilities: currentForm.publicKitchenFacilities || kmListingForm.publicKitchenFacilities || [],
                    publicBathroomFacilities: currentForm.publicBathroomFacilities || kmListingForm.publicBathroomFacilities || [],
                    addressNotes: currentForm.addressNotes || kmListingForm.addressNotes || '',
                    signature_data: signatureData || null,
                    agreed_to_terms: agreedToTerms
                }
            };`;

if (agentCode.includes(oldDraftPayload)) {
    agentCode = agentCode.replace(oldDraftPayload, newDraftPayload);
    console.log('Replaced oldDraftPayload');
} else {
    console.warn('Could not find exact oldDraftPayload');
}

// E. Fix handleSaveKostManagerListing propertyPayload
const oldSavePayload = `            const propertyPayload = {
                title: kmListingForm.title,
                description: kmListingForm.description,
                address: kmListingForm.address,
                city: kmListingForm.city,
                area: kmListingForm.area,
                province: kmListingForm.province || '',
                type: kmListingForm.type,
                price: finalPrice,
                owner_uid: validOwnerUid,
                mitra_id: validOwnerUid, // Add valid mitra_id for not-null DB constraint
                room_types: kmListingForm.roomTypes,
                status: 'draft',
                is_managed: true,
                facilities: kmListingForm.facilities,
                location: kmListingForm.location,
                rules: kmListingForm.rules,
                image_urls: (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),
                campuses: kmListingForm.campuses,
                metadata: {
                    publicParkingFacilities: kmListingForm.publicParkingFacilities || [],
                    publicKitchenFacilities: kmListingForm.publicKitchenFacilities || [],
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    addressNotes: kmListingForm.addressNotes || '',
                    signature_data: signatureData || null,
                    agreed_to_terms: agreedToTerms
                }
            };`;

const newSavePayload = `            const propertyPayload = {
                title: kmListingForm.title,
                description: kmListingForm.description,
                address: kmListingForm.address,
                city: kmListingForm.city,
                area: kmListingForm.area,
                type: kmListingForm.type,
                price: finalPrice,
                owner_uid: validOwnerUid,
                mitra_id: validOwnerUid, // Add valid mitra_id for not-null DB constraint
                room_types: kmListingForm.roomTypes,
                status: 'draft',
                is_managed: true,
                facilities: kmListingForm.facilities,
                location: kmListingForm.location,
                rules: kmListingForm.rules,
                image_urls: (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),
                campuses: kmListingForm.campuses,
                metadata: {
                    province: kmListingForm.province || '',
                    publicParkingFacilities: kmListingForm.publicParkingFacilities || ['Parkir Motor'],
                    publicKitchenFacilities: kmListingForm.publicKitchenFacilities || [],
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    addressNotes: kmListingForm.addressNotes || '',
                    signature_data: signatureData || null,
                    agreed_to_terms: agreedToTerms
                }
            };`;

if (agentCode.includes(oldSavePayload)) {
    agentCode = agentCode.replace(oldSavePayload, newSavePayload);
    console.log('Replaced oldSavePayload');
} else {
    console.warn('Could not find exact oldSavePayload');
}

// F. Fix openKostManagerListing dbKmProp & dbPropertyRecord loading
const oldDbKmLoading = `                setKmListingForm({
                    title: dbKmProp.title || req.kost_name,
                    description: dbKmProp.description || '',
                    address: dbKmProp.address || req.kost_address,
                    city: dbKmProp.city || 'Makassar',
                    area: dbKmProp.area || '',
                    type: dbKmProp.type || 'Campur',
                    price: dbKmProp.price || 0,
                    totalRooms: (dbKmProp.total_rooms && dbKmProp.total_rooms > 0) ? dbKmProp.total_rooms : (initialTotalRooms || 0),
                    owner_uid: resolvedOwnerUid,
                    roomTypes: dbKmProp.room_types || [],
                    facilities: dbKmProp.facilities || ['WiFi', 'Area Parkir'],
                    location: dbKmProp.location || initialCoords,
                    rules: dbKmProp.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: loadedKmImageUrls,
                    photoCategories: loadedKmPhotoCategories,
                    campuses: dbKmProp.campuses || [],
                    publicBathroomFacilities: dbKmProp.metadata?.publicBathroomFacilities || [],
                    publicKitchenFacilities: dbKmProp.metadata?.publicKitchenFacilities || [],
                    publicParkingFacilities: dbKmProp.metadata?.publicParkingFacilities || ['Parkir Motor']
                });`;

const newDbKmLoading = `                let rawKmCity = dbKmProp.city || 'Makassar';
                let rawKmArea = dbKmProp.area || '';
                let rawKmProvince = dbKmProp.province || dbKmProp.metadata?.province || '';
                if (rawKmCity.toLowerCase().startsWith('kecamatan') || rawKmCity.toLowerCase().startsWith('kec.')) {
                    if (!rawKmArea) rawKmArea = rawKmCity.replace(/^(Kecamatan|Kec\\.)\\s+/i, '').trim();
                    rawKmCity = 'Makassar';
                }
                setKmListingForm({
                    title: dbKmProp.title || req.kost_name,
                    description: dbKmProp.description || '',
                    address: dbKmProp.address || req.kost_address,
                    province: rawKmProvince,
                    city: rawKmCity,
                    area: rawKmArea,
                    type: dbKmProp.type || 'Campur',
                    price: dbKmProp.price || 0,
                    totalRooms: (dbKmProp.total_rooms && dbKmProp.total_rooms > 0) ? dbKmProp.total_rooms : (initialTotalRooms || 0),
                    owner_uid: resolvedOwnerUid,
                    roomTypes: dbKmProp.room_types || [],
                    facilities: dbKmProp.facilities || ['WiFi', 'Area Parkir'],
                    location: dbKmProp.location || initialCoords,
                    rules: dbKmProp.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: loadedKmImageUrls,
                    photoCategories: loadedKmPhotoCategories,
                    campuses: dbKmProp.campuses || [],
                    publicBathroomFacilities: dbKmProp.metadata?.publicBathroomFacilities || [],
                    publicKitchenFacilities: dbKmProp.metadata?.publicKitchenFacilities || [],
                    publicParkingFacilities: dbKmProp.metadata?.publicParkingFacilities || ['Parkir Motor']
                });`;

if (agentCode.includes(oldDbKmLoading)) {
    agentCode = agentCode.replace(oldDbKmLoading, newDbKmLoading);
    console.log('Replaced oldDbKmLoading');
} else {
    console.warn('Could not find exact oldDbKmLoading');
}

const oldDbPropLoading = `                setKmListingForm({
                    title: dbPropertyRecord.title || req.kost_name,
                    description: dbPropertyRecord.description || '',
                    address: dbPropertyRecord.address || req.kost_address,
                    city: dbPropertyRecord.city || 'Makassar',
                    area: dbPropertyRecord.area || '',
                    type: dbPropertyRecord.type || 'Campur',
                    price: dbPropertyRecord.price || 0,
                    totalRooms: (dbPropertyRecord.total_rooms && dbPropertyRecord.total_rooms > 0) ? dbPropertyRecord.total_rooms : (initialTotalRooms || 0),
                    owner_uid: resolvedOwnerUid,
                    roomTypes: [],
                    facilities: dbPropertyRecord.facilities || ['WiFi', 'Area Parkir'],
                    location: dbPropertyRecord.location || initialCoords,
                    rules: dbPropertyRecord.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: loadedPropImageUrls,
                    photoCategories: loadedPropPhotoCategories,
                    campuses: dbPropertyRecord.campuses || [],
                    publicBathroomFacilities: dbPropertyRecord.metadata?.publicBathroomFacilities || [],
                    publicKitchenFacilities: dbPropertyRecord.metadata?.publicKitchenFacilities || [],
                    publicParkingFacilities: dbPropertyRecord.metadata?.publicParkingFacilities || ['Parkir Motor']
                });`;

const newDbPropLoading = `                let rawPropCity = dbPropertyRecord.city || 'Makassar';
                let rawPropArea = dbPropertyRecord.area || '';
                let rawPropProvince = dbPropertyRecord.province || dbPropertyRecord.metadata?.province || '';
                if (rawPropCity.toLowerCase().startsWith('kecamatan') || rawPropCity.toLowerCase().startsWith('kec.')) {
                    if (!rawPropArea) rawPropArea = rawPropCity.replace(/^(Kecamatan|Kec\\.)\\s+/i, '').trim();
                    rawPropCity = 'Makassar';
                }
                setKmListingForm({
                    title: dbPropertyRecord.title || req.kost_name,
                    description: dbPropertyRecord.description || '',
                    address: dbPropertyRecord.address || req.kost_address,
                    province: rawPropProvince,
                    city: rawPropCity,
                    area: rawPropArea,
                    type: dbPropertyRecord.type || 'Campur',
                    price: dbPropertyRecord.price || 0,
                    totalRooms: (dbPropertyRecord.total_rooms && dbPropertyRecord.total_rooms > 0) ? dbPropertyRecord.total_rooms : (initialTotalRooms || 0),
                    owner_uid: resolvedOwnerUid,
                    roomTypes: [],
                    facilities: dbPropertyRecord.facilities || ['WiFi', 'Area Parkir'],
                    location: dbPropertyRecord.location || initialCoords,
                    rules: dbPropertyRecord.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: loadedPropImageUrls,
                    photoCategories: loadedPropPhotoCategories,
                    campuses: dbPropertyRecord.campuses || [],
                    publicBathroomFacilities: dbPropertyRecord.metadata?.publicBathroomFacilities || [],
                    publicKitchenFacilities: dbPropertyRecord.metadata?.publicKitchenFacilities || [],
                    publicParkingFacilities: dbPropertyRecord.metadata?.publicParkingFacilities || ['Parkir Motor']
                });`;

if (agentCode.includes(oldDbPropLoading)) {
    agentCode = agentCode.replace(oldDbPropLoading, newDbPropLoading);
    console.log('Replaced oldDbPropLoading');
} else {
    console.warn('Could not find exact oldDbPropLoading');
}

fs.writeFileSync(agentDashboardPath, agentCode, 'utf-8');
console.log('AgentDashboard.tsx updated successfully!');

// 2. Edit adminService.ts
const adminServicePath = path.join(__dirname, '../public/adminService.ts');
let adminCode = fs.readFileSync(adminServicePath, 'utf-8');

adminCode = adminCode.replace(`      province: kostData.province || '',`, `      metadata: {
        ...(kostData.metadata || {}),
        province: kostData.province || ''
      },`);

adminCode = adminCode.replace(`      province: kostData.province !== undefined ? kostData.province : undefined,`, `      metadata: {
        ...(existing.metadata || {}),
        ...(kostData.metadata || {}),
        ...(kostData.province !== undefined ? { province: kostData.province } : {})
      },`);

fs.writeFileSync(adminServicePath, adminCode, 'utf-8');
console.log('adminService.ts updated successfully!');

// 3. Edit KostManagerPortal.tsx
const kmPortalPath = path.join(__dirname, '../public/components/admin/KostManagerPortal.tsx');
let kmCode = fs.readFileSync(kmPortalPath, 'utf-8');

kmCode = kmCode.replace(`                province: newPropForm.province || '',`, `                metadata: {
                    ...(newPropForm.metadata || {}),
                    province: newPropForm.province || ''
                },`);

kmCode = kmCode.replace(`            province: (p as any).province || '',`, `            province: (p as any).province || p.metadata?.province || '',`);

fs.writeFileSync(kmPortalPath, kmCode, 'utf-8');
console.log('KostManagerPortal.tsx updated successfully!');
