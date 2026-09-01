
export enum UserRole {
  USER = 'user',
  OWNER = 'owner',
  ADMIN = 'admin',
  SURVEY_AGENT = 'survey_agent'
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  kostId: string;
  kostName: string;
  userId: string;
  userName: string;
  variantName: string;
  durationMonths: number;
  startDate: string;
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Paid' | 'Cancelled';
  createdAt: string;
}

export type PricingPeriod = 'harian' | 'mingguan' | 'bulanan' | '3bulanan' | '6bulanan' | 'tahunan';

export interface RoomPricing {
  period: PricingPeriod;
  price: number;
}

export interface RoomType {
  name: string;
  size: string;
  price: number; // Base price (usually monthly, kept for sorting)
  pricing?: RoomPricing[]; // New flexible pricing array
  features: string[]; // General specs/highlights (e.g. "Termasuk Listrik", "Lantai 1")
  roomFacilities: string[]; // Specific room items (e.g. "Kasur", "Lemari")
  bathroomFacilities: string[]; // Bathroom specifics
  kitchenFacilities?: string[]; // Kitchen specifics (if Dapur Dalam)
  isAvailable?: boolean; // Availability status
  availableRoomCount?: number; // Number of available rooms for this type
  maxOccupants?: number; // Maximum number of occupants allowed
  additionalCostPerPerson?: number; // Additional cost per extra person
  images?: (string | ImageUrlObject | any)[];
  photoCategories?: string[];
  categorizedPhotos?: Record<string, string[]>;
  rooms?: any[];
}

export interface Review {
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface VideoUrlObject {
  original: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Kost {
  id: string;
  ownerUid: string; // Replaced ownerId
  title: string; // Replaced name
  description: string;
  price: number; // Replaced pricePerMonth (Base price)
  facilities: string[]; // General/Building facilities
  address: string; // Replaced location string
  location: GeoLocation; // Replaced latitude/longitude
  imageUrls: (string | ImageUrlObject)[]; // Replaced imageUrl and gallery
  videoUrls?: (string | VideoUrlObject)[]; // Added for video support
  instagramUrl?: string; // New: Link to Instagram Review
  tiktokUrl?: string;    // New: Link to TikTok Review
  status: 'draft' | 'published'; // Replaced 'Aktif' | 'Draft'
  createdAt: string;
  updatedAt?: string;

  // App specific fields
  province?: string;
  city: string;
  area: string;
  type: 'Putra' | 'Putri' | 'Campur';
  isVerified: boolean;
  isManaged: boolean;
  rating: number;
  rules: string[];

  // Arrays for locations and facilities
  campuses?: { name: string; distance: string; transportMode?: 'walk' | 'motorcycle' | 'car' | 'transit'; lat?: number; lng?: number; walkDuration?: string; motoDuration?: string; carDuration?: string; isLiveGoogleApi?: boolean }[];
  publicFacilities?: { name: string; distance: string; transportMode?: 'walk' | 'motorcycle' | 'car' | 'transit'; lat?: number; lng?: number; walkDuration?: string; motoDuration?: string; carDuration?: string; isLiveGoogleApi?: boolean }[];
  roomTypes: RoomType[];
  reviews: Review[];
  virtualTourUrl?: string;

  // Analytics
  views?: number;

  // Additional Fees
  additionalFeePrice?: number;
  additionalFeeName?: string;
  additionalFeeStartsFrom?: 'month_1' | 'month_2';

  // Omnichannel Contact Info
  omnichannelContactName?: string;
  omnichannelContactPhone?: string;
  omnichannelContactType?: 'owner' | 'caretaker';
  
  // New Caretaker Fields
  contactSelection?: 'profile' | 'caretaker';
  caretakerName?: string;
  caretakerGender?: 'Pria' | 'Wanita';
  caretakerPhone?: string;

  // KostManager / Management Type
  managed_by?: 'self' | 'kostmanager';

  // Photo categories and metadata from survey / mitra input
  photoCategories?: string[];
  categorizedPhotos?: Record<string, string[]>;
  photosMeta?: ImageUrlObject[];
}

export interface ImageUrlObject {
  original: string;
  url?: string;
  webp?: string;
  thumbnail?: string;
  label?: string;
  category?: string;
  caption?: string;
}

export interface DatabaseProduct {
  id: string;
  campus: string; // campusName
  city: string;
  area: string;
  description: string;
  price: number;
  totalData: number; // Estimated count of kosts in file
  fileUrls: {
    excel?: string;
    pdf?: string;
    googleDrive?: string;
    coverImage?: ImageUrlObject;
    file?: string;
    link?: string;
  };
  fileType: 'link' | 'upload'; // Google Drive Link or Direct Upload
  fileName?: string; // Original filename if upload
  status: 'available' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export type Property = Kost;

export interface Transaction {
  id: string;
  userId: string;
  productId: string;
  productType: 'database' | 'kost_booking' | 'survey' | string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paymentMethod?: string;
  pakasirOrderId?: string;
  pakasirLink?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export enum Page {
  HOME = '/',
  LISTINGS = '/listings',
  PRODUCTS = '/products',
  OWNER = '/owner',
  ABOUT = '/about',
  CONTACT = '/contact',
  LOGIN = '/login',
  DETAIL = '/detail', // Backward compatibility / old base
  DETAIL_PATH = '/kost/:id',
  DASHBOARD_OWNER = '/dashboard-owner',
  DASHBOARD_MITRA = '/dashboard-mitra',
  DASHBOARD_ADMIN = '/dashboard-admin',
  DASHBOARD_AGENT = '/dashboard-agent',
  CHAT = '/chat',
  MY_BOOKINGS = '/my-bookings',
  PROFILE = '/profile',
  MITRA_PROFILE = '/mitra-profile',
  SURVEY_SERVICE = '/survey-service',
  SURVEY_CHECKOUT = '/survey-checkout',
  TERMS = '/syarat-ketentuan',
  ARTICLES = '/artikel',
  ARTICLE_DETAIL = '/artikel/:slug',
  KOSTMANAGER = '/kostmanager'
}

export interface SurveyRequest {
  id: string;
  user_id: string;
  kost_id: string;
  transaction_id: string;
  status: string;
  kost_name: string;
  kost_address: string;
  owner_phone: string;
  survey_date: string;
  survey_time: string;
  notes: string;
  agent_name?: string;
  agent_phone?: string;
  agent_photo_url?: string;
  assigned_agent_id?: string;
  result_drive_link?: string;
  evaluation_summary?: {
    room_facilities?: string;
    room_facilities_photos?: string[];
    room_facilities_rating?: number;
    bathroom_facilities?: string;
    bathroom_facilities_photos?: string[];
    bathroom_facilities_rating?: number;
    water_check?: string;
    water_check_photos?: string[];
    water_check_rating?: number;
    wifi_check?: string;
    wifi_check_photos?: string[];
    wifi_check_rating?: number;
    security_check?: string;
    security_check_photos?: string[];
    security_check_rating?: number;
    access_check?: string;
    access_check_photos?: string[];
    access_check_rating?: number;
    /** @deprecated Use environmental_conditions instead */
    resident_testimonial?: string;
    /** @deprecated Use environmental_conditions_photos instead */
    resident_testimonial_photos?: string[];
    environmental_conditions?: string;
    environmental_conditions_photos?: string[];
    environmental_conditions_rating?: number;
    reschedule_history?: Array<{
      date: string;
      time: string;
      reason: string;
      updatedAt: string;
    }>;
  };
  user_rating?: number;
  user_comment?: string;
  created_at: string;
  transaction?: {
    amount: number;
    status: string;
    metadata?: any;
  };
  user?: {
    name: string;
    email: string;
    phone: string;
    photo_url?: string;
  };
}

export interface KostManagerRequest {
  id: string;
  transaction_id: string;
  user_id: string;
  kost_name: string;
  kost_type?: string;
  empty_rooms?: number;
  kost_address: string;
  status: string; // PENDING_ASSIGNMENT, AGENT_ASSIGNED, SURVEYING, PENDING_ONBOARDING, COMPLETED, CANCELLED
  agent_name?: string;
  agent_phone?: string;
  agent_photo_url?: string;
  assigned_agent_id?: string;
  result_drive_link?: string;
  created_at: string;
  updated_at: string;
  transaction?: {
    amount: number;
    status: string;
    metadata?: any;
    payment_method?: string;
    created_at?: string;
  };
  user?: {
    name: string;
    email: string;
    phone: string;
    photo_url?: string;
  };
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface KostManagerPackage {
  id: string;
  duration_months: number;
  price: number;
  label: string;
  is_active: boolean;
}

