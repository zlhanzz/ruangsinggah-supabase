const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env
let envContent = '';
try {
    envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
} catch (e) {
    try {
        envContent = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf8');
    } catch (e2) {
        console.log('No env file found');
    }
}

const env = {};
if (envContent) {
    envContent.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx !== -1) {
            const key = line.substring(0, idx).trim();
            const value = line.substring(idx + 1).trim();
            env[key] = value;
        }
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://sgcmnsnokrztocnhxnqm.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDMxMjUsImV4cCI6MjA4NjYxOTEyNX0.SuBkVkPAEu_LGQUklbrhkK1Uw8nlsvV9lXgHVBuqYos';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock getCurrentDate
const getCurrentDate = () => new Date();
const convertTimestamp = (ts) => {
  if (!ts) return getCurrentDate().toISOString();
  if (typeof ts === 'string') return ts;
  return ts;
};

const ensureAbsoluteUrl = (pathStr, bucket) => {
  if (!pathStr) return '';
  const trimmedPath = pathStr.trim();
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${trimmedPath}`;
};

const getDisplayImageUrl = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return ensureAbsoluteUrl(img, 'properties');
  const path = img.webp || img.original || img.thumbnail || '';
  return ensureAbsoluteUrl(path, 'properties');
};

const getDisplayVideoUrl = (vid) => {
  if (!vid) return '';
  if (typeof vid === 'string') return ensureAbsoluteUrl(vid, 'properties');
  const path = vid.webp || vid.original || vid.thumbnail || '';
  return ensureAbsoluteUrl(path, 'properties');
};

async function getPublishedProperties() {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => {
      const rawImages = row.image_urls || [];
      const images = rawImages.map(getDisplayImageUrl).filter((u) => u !== '');

      const rawVideos = row.video_urls || [];
      const videos = rawVideos.map(getDisplayVideoUrl).filter((u) => u !== '');

      return {
        id: row.id,
        ownerUid: row.owner_uid,
        title: row.title || 'Tanpa Nama',
        description: row.description || '',
        price: row.price || (row.room_types && row.room_types.length > 0 ? row.room_types[0].price : 0),
        facilities: row.facilities || [],
        address: row.address || '',
        city: row.city || '',
        type: row.type || 'Campur',
        status: row.status || 'published',
        isVerified: row.is_verified ?? false,
        isManaged: row.is_managed ?? false,
        rating: row.rating || 0,
        location: row.location || { lat: 0, lng: 0 },
        imageUrls: images,
        videoUrls: videos,
        instagramUrl: row.instagram_url || '',
        tiktokUrl: row.tiktok_url || '',
        roomTypes: row.room_types || [],
        reviews: row.reviews || [],
        rules: row.rules || [],
        campuses: row.campuses || [],
        publicFacilities: row.public_facilities || [],
        virtualTourUrl: row.virtual_tour_url || '',
        additionalFeePrice: row.additional_fee_price,
        additionalFeeName: row.additional_fee_name,
        additionalFeeStartsFrom: row.additional_fee_starts_from,
        createdAt: convertTimestamp(row.created_at),
        updatedAt: convertTimestamp(row.updated_at),
        omnichannelContactName: row.omnichannel_contact_name,
        omnichannelContactPhone: row.omnichannel_contact_phone,
        omnichannelContactType: row.omnichannel_contact_type,
      };
    });
  } catch (error) {
    console.error('Error fetching published properties:', error);
    return [];
  }
}

async function run() {
    const list = await getPublishedProperties();
    console.log('Result length:', list.length);
    if (list.length > 0) {
        console.log('First entry properties:', Object.keys(list[0]));
        console.log('First entry details:', {
            id: list[0].id,
            title: list[0].title,
            isVerified: list[0].isVerified,
            isManaged: list[0].isManaged
        });
    }
}
run();
