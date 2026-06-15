import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { User, ShieldCheck, Landmark, Save, X, Edit2, Upload, BadgeCheck, AlertCircle, Clock, Search } from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';
import Tesseract from 'tesseract.js';

interface AgentProfileProps {
    uid: string;
    onEditModeChange?: (isEditing: boolean) => void;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ uid, onEditModeChange }) => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingKtp, setIsUploadingKtp] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    
    const [formData, setFormData] = useState({
        display_name: '',
        name: '', // sync with users.name
        phone: '',
        address: '',
        ktp_number: '',
        ktp_address: '',
        ktp_photo_url: '',
        photo_url: '',
        verification_status: 'unverified',
        verification_notes: '',
        referral_code: '',
        gender: '',
        religion: '',
        occupation: '',
        relationship_status: '',
        birth_place: '',
        birth_date: ''
    });

    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const [isExpandingVerification, setIsExpandingVerification] = useState(false);
    const [sameAsKtp, setSameAsKtp] = useState(false);
    const [profileImgError, setProfileImgError] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [uid]);

    useEffect(() => {
        onEditModeChange?.(isEditing);
    }, [isEditing]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [profileRes, verifRes, agentRes] = await Promise.all([
                supabase.from('users').select('*').eq('id', uid).maybeSingle(),
                supabase.from('user_verifications').select('*').eq('user_id', uid).maybeSingle(),
                supabase.from('agents').select('referral_code').eq('user_id', uid).maybeSingle()
            ]);

            const profile = profileRes.data;
            const verif = verifRes.data || {};
            const agentData = agentRes.data;

            if (profile) {
                setFormData({
                    display_name: profile.name || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    ktp_number: verif.ktp_number || '',
                    ktp_address: verif.ktp_address || '',
                    ktp_photo_url: verif.ktp_photo_url || '',
                    photo_url: profile.photo_url || '',
                    verification_status: profile.verification_status || 'unverified',
                    verification_notes: verif.verification_notes || '',
                    name: profile.name || '',
                    referral_code: agentData?.referral_code || '',
                    gender: profile.gender || '',
                    religion: profile.religion || '',
                    occupation: profile.occupation || '',
                    relationship_status: profile.relationship_status || '',
                    birth_place: profile.birth_place || '',
                    birth_date: profile.birth_date || ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const performOcr = async (imageUrl: string) => {
        setIsScanning(true);
        try {
            const { data: { text } } = await Tesseract.recognize(imageUrl, 'ind');
            const normalizedText = text.toUpperCase();

            // 1. SMART NIK EXTRACTOR (Corrects common OCR digit confusion, searches all tokens)
            const digitCorrection = (str: string) => {
                return str
                    .replace(/O/g, '0')
                    .replace(/o/g, '0')
                    .replace(/[Il|i\[\]]/g, '1')
                    .replace(/B/g, '8')
                    .replace(/S/g, '5')
                    .replace(/s/g, '5')
                    .replace(/[gq]/g, '9')
                    .replace(/[zZ]/g, '2')
                    .replace(/A/g, '4')
                    .replace(/T/g, '7')
                    .replace(/\D/g, ''); // keep only numbers
            };

            let extractedNik = '';
            
            // Try standard label matching first
            const nikLabelMatch = normalizedText.match(/(?:NIK|MK|NK|NI\s*K|N\s*K|HIK|MIK|NX|H1K|N1K|NlK|NI\.K|N\s*I\s*K)[:\s]+([0-9A-Z?|lIo\-\s]{13,22})/i);
            if (nikLabelMatch && nikLabelMatch[1]) {
                const cleaned = digitCorrection(nikLabelMatch[1]);
                if (cleaned.length === 16) {
                    extractedNik = cleaned;
                }
            }

            // Fallback 1: Scan words/tokens for any 16-digit candidate after digit correction
            if (!extractedNik) {
                const words = normalizedText.split(/[\s,.:;\-_]+/);
                for (const word of words) {
                    const cleaned = digitCorrection(word);
                    if (cleaned.length === 16) {
                        extractedNik = cleaned;
                        break;
                    }
                }
            }

            // Fallback 2: Scan line by line for any line that cleans up to 16 digits
            if (!extractedNik) {
                const rawLines = normalizedText.split('\n');
                for (const line of rawLines) {
                    const cleaned = digitCorrection(line);
                    if (cleaned.length === 16) {
                        extractedNik = cleaned;
                        break;
                    } else if (cleaned.length >= 16) {
                        const subMatch = cleaned.match(/[1-9][0-9]{15}/);
                        if (subMatch) {
                            extractedNik = subMatch[0];
                            break;
                        }
                        extractedNik = cleaned.substring(0, 16);
                        break;
                    }
                }
            }

            // 2. NAME EXTRACTOR
            let extractedName = '';
            const nameMatch = normalizedText.match(/(?:NAMA|HAMA|NANA|NAMA )[:\s]+([A-Z\s'.]+)/i);
            if (nameMatch && nameMatch[1]) {
                extractedName = nameMatch[1].split('\n')[0].trim();
            }

            // 2A. PLACE & DATE OF BIRTH EXTRACTOR
            let extractedBirthPlace = '';
            let extractedBirthDate = '';
            const birthMatch = normalizedText.match(/(?:TEMPAT|TGL|LAHIR|LAH1R|TANGGAL)[:\s]+([A-Z\s\.\-]+)[,\s]+([0-9\s\-OIl]{8,15})/i);
            if (birthMatch) {
                extractedBirthPlace = birthMatch[1].trim();
                const rawDate = birthMatch[2].replace(/\s/g, '');
                const cleanedDate = rawDate
                    .replace(/O/g, '0')
                    .replace(/o/g, '0')
                    .replace(/[Il|]/g, '1')
                    .replace(/\D/g, ''); // keep only numbers: DDMMYYYY
                
                if (cleanedDate.length === 8) {
                    const dd = cleanedDate.substring(0, 2);
                    const mm = cleanedDate.substring(2, 4);
                    const yyyy = cleanedDate.substring(4, 8);
                    extractedBirthDate = `${yyyy}-${mm}-${dd}`;
                }
            }

            // 2B. GENDER EXTRACTOR
            let extractedGender = '';
            const genderMatch = normalizedText.match(/(?:JENIS KELAMIN|KELAMIN)[:\s]+([A-Z\-]+)/i);
            if (genderMatch) {
                const genVal = genderMatch[1].toUpperCase();
                if (genVal.includes('LAK') || genVal.includes('PRIA')) {
                    extractedGender = 'Pria';
                } else if (genVal.includes('PER') || genVal.includes('WAN')) {
                    extractedGender = 'Wanita';
                }
            }

            // 2C. RELIGION EXTRACTOR
            let extractedReligion = '';
            const religionMatch = normalizedText.match(/AGAMA[:\s]+([A-Z]+)/i);
            if (religionMatch) {
                const relVal = religionMatch[1].toUpperCase();
                if (relVal.includes('ISLAM')) extractedReligion = 'Islam';
                else if (relVal.includes('PRO') || relVal.includes('KRIS')) extractedReligion = 'Kristen Protestan';
                else if (relVal.includes('KAT') || relVal.includes('CHRI')) extractedReligion = 'Kristen Katolik';
                else if (relVal.includes('HIN')) extractedReligion = 'Hindu';
                else if (relVal.includes('BUD')) extractedReligion = 'Buddha';
                else if (relVal.includes('KONG') || relVal.includes('KHU')) extractedReligion = 'Konghucu';
            }

            // 2D. MARITAL STATUS EXTRACTOR
            let extractedStatus = '';
            const statusMatch = normalizedText.match(/(?:STATUS PERKAWINAN|STATUS)[:\s]+([A-Z\s]+)/i);
            if (statusMatch) {
                const statVal = statusMatch[1].toUpperCase();
                if (statVal.includes('BELUM') || statVal.includes('SINGLE')) extractedStatus = 'Single';
                else if (statVal.includes('KAWIN') || statVal.includes('MARRIED')) extractedStatus = 'Menikah';
            }

            // 2E. OCCUPATION EXTRACTOR
            let extractedOccupation = '';
            const jobMatch = normalizedText.match(/(?:PEKERJAAN|PEKERJAAN )[:\s]+([A-Z\s\/\-]+)/i);
            if (jobMatch) {
                extractedOccupation = jobMatch[1].trim();
                extractedOccupation = extractedOccupation.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            }

            // 3. SMART ADDRESS BUILDER (Concatenates street address, RT/RW, Kelurahan, Kecamatan dynamically)
            const cleanPrefix = (str: string, labelRegex: RegExp) => {
                return str.replace(labelRegex, '').replace(/^[:\s\-=\.]*/, '').trim();
            };

            const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let street = '';
            let rtrw = '';
            let keldesa = '';
            let kecamatan = '';

            const alamatIdx = lines.findIndex(l => /ALAMAT|ALAM\s+AT|ALANAT|AL4MAT|ALAM4T|ALAMT/i.test(l));
            if (alamatIdx !== -1) {
                street = cleanPrefix(lines[alamatIdx], /ALAMAT|ALAM\s+AT|ALANAT|AL4MAT|ALAM4T|ALAMT/i);
                
                // Scan up to 5 lines after "ALAMAT"
                for (let i = alamatIdx + 1; i < Math.min(alamatIdx + 6, lines.length); i++) {
                    const line = lines[i];
                    if (/AGAMA|STATUS|PEKERJAAN|WARGANEGARA|BERLAKU|GOL\.\s*DARAH/i.test(line)) {
                        break;
                    }
                    if (/RT\s*[\/\s]*\s*RW/i.test(line)) {
                        rtrw = cleanPrefix(line, /RT\s*[\/\s]*\s*RW/i);
                        continue;
                    }
                    if (/KEL\s*[\/\s]*\s*DESA|KELURAHAN/i.test(line)) {
                        keldesa = cleanPrefix(line, /KEL\s*[\/\s]*\s*DESA|KELURAHAN/i);
                        continue;
                    }
                    if (/KECAMATAN/i.test(line)) {
                        kecamatan = cleanPrefix(line, /KECAMATAN/i);
                        continue;
                    }
                    if (!rtrw && !keldesa && !kecamatan && street.length < 80) {
                        street += ' ' + line;
                    }
                }
            } else {
                // Regex fallback if layout is scattered
                const rtrwMatch = normalizedText.match(/(?:RT\s*[\/\s]*\s*RW)[:\s]+([0-9\/\s\-]+)/i);
                if (rtrwMatch) rtrw = rtrwMatch[1].trim();

                const kelMatch = normalizedText.match(/(?:KEL\s*[\/\s]*\s*DESA|KELURAHAN)[:\s]+([A-Z0-9\s\-\.\/]+)/i);
                if (kelMatch) keldesa = kelMatch[1].trim();

                const kecMatch = normalizedText.match(/(?:KECAMATAN)[:\s]+([A-Z0-9\s\-\.\/]+)/i);
                if (kecMatch) kecamatan = kecMatch[1].trim();
            }

            const addressParts = [];
            if (street) addressParts.push(street);
            if (rtrw) addressParts.push(`RT. ${rtrw}`);
            if (keldesa) addressParts.push(`Kel. ${keldesa}`);
            if (kecamatan) addressParts.push(`Kec. ${kecamatan}`);

            const extractedAddress = addressParts.join(', ');

            setFormData(prev => ({
                ...prev,
                ktp_number: extractedNik || prev.ktp_number,
                display_name: (extractedName && extractedName.length > 2) ? extractedName : prev.display_name,
                name: (extractedName && extractedName.length > 2) ? extractedName : prev.name,
                ktp_address: extractedAddress || prev.ktp_address,
                birth_place: extractedBirthPlace || prev.birth_place,
                birth_date: extractedBirthDate || prev.birth_date,
                gender: extractedGender || prev.gender,
                religion: extractedReligion || prev.religion,
                occupation: extractedOccupation || prev.occupation,
                relationship_status: extractedStatus || prev.relationship_status
            }));

            if (extractedNik || extractedName || extractedAddress) {
                alert('Data KTP berhasil dipindai otomatis.');
            }
        } catch (error) {
            console.error('OCR Error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingKtp(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uid}-${Math.random()}.${fileExt}`;
            const filePath = `ktp/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('survey-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('survey-photos')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, ktp_photo_url: publicUrl }));
            performOcr(publicUrl);
        } catch (error) {
            console.error('Error uploading KTP:', error);
        } finally {
            setIsUploadingKtp(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB');
            return;
        }

        setIsUploadingPhoto(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uid}-${Date.now()}.${fileExt}`;
            const filePath = `profiles/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('survey-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('survey-photos')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, photo_url: publicUrl }));
            alert('Foto profil berhasil diunggah. Jangan lupa klik "Simpan" di bawah!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Gagal mengunggah foto profil.');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!formData.phone) {
            alert('Nomor WhatsApp wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            await supabase.auth.updateUser({ data: formData });
            await supabase
                .from('users')
                .upsert({
                    id: uid,
                    name: formData.display_name,
                    full_name: formData.display_name,
                    phone: formData.phone,
                    address: formData.address,
                    photo_url: formData.photo_url,
                    gender: formData.gender,
                    religion: formData.religion,
                    occupation: formData.occupation,
                    relationship_status: formData.relationship_status,
                    birth_place: formData.birth_place,
                    birth_date: formData.birth_date || null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
            setIsEditing(false);
            alert('Profile diperbarui');
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifySubmit = async () => {
        if (!formData.phone || !formData.ktp_photo_url) {
            alert('Lengkapi Foto KTP dan No WhatsApp');
            return;
        }
        setIsSubmitting(true);
        try {
            const updatedData = { ...formData, verification_status: 'pending' };
            await supabase.auth.updateUser({ data: updatedData });
            await Promise.all([
                supabase
                    .from('users')
                    .update({
                        name: formData.display_name,
                        full_name: formData.display_name,
                        phone: formData.phone,
                        address: formData.address,
                        gender: formData.gender,
                        religion: formData.religion,
                        occupation: formData.occupation,
                        relationship_status: formData.relationship_status,
                        birth_place: formData.birth_place,
                        birth_date: formData.birth_date || null,
                        verification_status: 'pending',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', uid),
                supabase
                    .from('user_verifications')
                    .upsert({
                        user_id: uid,
                        ktp_number: formData.ktp_number,
                        ktp_address: formData.ktp_address,
                        ktp_photo_url: formData.ktp_photo_url,
                        verification_status: 'pending',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })
            ]);
            setFormData(updatedData as any);
            setIsExpandingVerification(false);
            alert('Verifikasi dikirim');
        } catch (error) {
            console.error('Error submitting verification:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20 text-left">
            {/* Header */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-4xl border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0 overflow-hidden relative">
                            {formData.photo_url && !profileImgError ? (
                                <img 
                                    src={formData.photo_url} 
                                    className="w-full h-full object-cover" 
                                    alt="Profile" 
                                    onError={() => setProfileImgError(true)}
                                />
                            ) : (
                                <span className="text-orange-200 font-black">{formData.display_name?.charAt(0).toUpperCase() || <User size={48} />}</span>
                            )}
                            
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-orange-600/40 backdrop-blur-sm flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center cursor-pointer hover:bg-orange-600 hover:text-white transition-all border border-gray-100 group-hover:scale-110">
                            <Upload size={18} />
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                        </label>
                    </div>
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                {formData.display_name || 'Agen Surveyor'}
                            </h2>
                            {formData.verification_status === 'verified' && (
                                <div className="bg-orange-600 text-white rounded-full p-1.5 shadow-lg shadow-orange-200" title="Terverifikasi">
                                    <BadgeCheck size={18} />
                                </div>
                            )}
                        </div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                            ID Agen: {uid.slice(0, 12).toUpperCase()}
                        </p>
                        
                        <div className="mt-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4 max-w-md">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Aksi Penting</p>
                                <p className="text-[10px] font-bold text-gray-700 leading-tight">
                                    Gunakan foto profil asli Anda (wajah terlihat jelas) untuk meningkatkan kepercayaan user & kredibilitas sebagai surveyor resmi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Verification */}
                <div id="verification-section" className="md:col-span-2">
                    {formData.verification_status === 'verified' ? (
                        <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-orange-600 text-white flex items-center justify-center shadow-xl shadow-orange-200">
                                    <BadgeCheck size={32} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-black text-orange-900 uppercase tracking-tight">Akun Terverifikasi</h3>
                                    <p className="text-xs font-bold text-orange-600/70 uppercase tracking-widest mt-1 italic">Selamat! Anda sudah bisa menerima orderan survey.</p>
                                </div>
                            </div>
                            <div className="px-6 py-2 bg-white/50 border border-orange-100 rounded-xl text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                Mitra Resmi RuangSinggah
                            </div>
                        </div>
                    ) : formData.verification_status === 'pending' ? (
                        <div className="bg-orange-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden text-center md:text-left">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center border border-white/30 animate-pulse">
                                        <Clock size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Verifikasi Sedang Ditinjau</h3>
                                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest leading-relaxed">Tim kami sedang melakukan validasi terhadap data Anda. Harap tunggu dalam 1x24 jam.</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 px-8 py-4 rounded-3xl border border-white/20 backdrop-blur-md">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Status: Menunggu</span>
                                </div>
                            </div>
                        </div>
                    ) : (formData.verification_status === 'rejected' && !isExpandingVerification) ? (
                        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5 text-left">
                                <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200">
                                    <AlertCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Verifikasi Ditolak</h3>
                                    <p className="text-xs font-bold text-red-600 uppercase mt-1 italic">Alasan: {formData.verification_notes || 'Data tidak sesuai.'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsExpandingVerification(true)} 
                                className="px-10 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                            >
                                Perbaiki Data & Ajukan Lagi
                            </button>
                        </div>
                    ) : (formData.verification_status === 'unverified' && !isExpandingVerification) ? (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100"><ShieldCheck size={32} /></div>
                                <div className="text-left">
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Belum Terverifikasi</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">Selesaikan verifikasi untuk menerima orderan</p>
                                </div>
                            </div>
                            <button onClick={() => setIsExpandingVerification(true)} className="px-10 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all">Verifikasi Sekarang</button>
                        </div>
                    ) : (
                        <div className="bg-orange-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20"><ShieldCheck size={24} /></div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight">
                                                {formData.verification_status === 'rejected' ? 'Perbaikan Data Verifikasi' : 'Input Data Verifikasi'}
                                            </h3>
                                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Pastikan data sesuai dengan KTP asli Anda</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsExpandingVerification(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><X size={20} /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Foto KTP (Asli)</label>
                                            <div className="relative aspect-[1.6/1] w-full rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                                                {formData.ktp_photo_url ? (
                                                    <img src={formData.ktp_photo_url} className="w-full h-full object-cover" alt="KTP" />
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center gap-3">
                                                        <Upload size={32} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{isUploadingKtp ? 'Uploading...' : 'Upload KTP'}</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleKtpUpload} disabled={isUploadingKtp} />
                                                    </label>
                                                )}
                                                {isScanning && <div className="absolute inset-0 bg-orange-600/50 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs">Scanning...</div>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Nama (Sesuai KTP)</label>
                                            <input name="display_name" value={formData.display_name} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">NIK (16 Digit)</label>
                                            <input name="ktp_number" value={formData.ktp_number} onChange={handleInputChange} maxLength={16} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Tempat Lahir (Sesuai KTP)</label>
                                            <input name="birth_place" value={formData.birth_place} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" placeholder="Tempat Lahir" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Tanggal Lahir (Sesuai KTP)</label>
                                            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none cursor-pointer" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Jenis Kelamin</label>
                                            <select name="gender" value={formData.gender || ''} onChange={handleInputChange as any} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none appearance-none cursor-pointer [&>option]:bg-gray-800">
                                                <option value="">Pilih Jenis Kelamin</option>
                                                <option value="Pria">Pria</option>
                                                <option value="Wanita">Wanita</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Agama</label>
                                            <select name="religion" value={formData.religion || ''} onChange={handleInputChange as any} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none appearance-none cursor-pointer [&>option]:bg-gray-800">
                                                <option value="">Pilih Agama</option>
                                                <option value="Islam">Islam</option>
                                                <option value="Kristen Protestan">Kristen Protestan</option>
                                                <option value="Kristen Katolik">Kristen Katolik</option>
                                                <option value="Hindu">Hindu</option>
                                                <option value="Buddha">Buddha</option>
                                                <option value="Konghucu">Konghucu</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Pekerjaan</label>
                                            <input name="occupation" value={formData.occupation || ''} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" placeholder="Pekerjaan" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Status Perkawinan</label>
                                            <select name="relationship_status" value={formData.relationship_status || ''} onChange={handleInputChange as any} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none appearance-none cursor-pointer [&>option]:bg-gray-800">
                                                <option value="">Pilih Status</option>
                                                <option value="Single">Belum Kawin</option>
                                                <option value="Menikah">Kawin</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Alamat Sesuai KTP</label>
                                            <textarea name="ktp_address" value={formData.ktp_address} onChange={handleInputChange} rows={2} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none resize-none" />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black opacity-60 uppercase tracking-widest block">Alamat Asal</label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={sameAsKtp} onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setSameAsKtp(checked);
                                                        if (checked) setFormData(prev => ({ ...prev, address: prev.ktp_address }));
                                                    }} className="w-4 h-4 rounded" />
                                                    <span className="text-[9px] font-black uppercase text-white/70">Sama dengan KTP</span>
                                                </label>
                                            </div>
                                            <textarea name="address" value={formData.address} onChange={handleInputChange} disabled={sameAsKtp} rows={2} className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none resize-none disabled:opacity-50" />
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <div className="h-full bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col items-center justify-center text-center">
                                            <BadgeCheck size={40} className="mb-4 opacity-40" />
                                            <h4 className="text-sm font-black uppercase tracking-widest mb-4">Tips Verifikasi</h4>
                                            <ul className="text-[10px] font-bold text-white/60 space-y-3 text-left uppercase">
                                                <li>• Gunakan KTP asli</li>
                                                <li>• Tulisan harus terbaca</li>
                                                <li>• Cahaya cukup</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 text-left">
                                        {formData.verification_status === 'verified' ? <BadgeCheck className="text-green-400" /> : <Clock className="text-white/50" />}
                                        <div>
                                            <p className="text-[10px] font-black opacity-60 uppercase">Status Verifikasi</p>
                                            <p className="text-xs font-black uppercase">{formData.verification_status === 'verified' ? 'verified' : formData.verification_status === 'pending' ? 'menunggu' : 'belum lengkap'}</p>
                                        </div>
                                    </div>
                                    {(formData.verification_status === 'unverified' || formData.verification_status === 'rejected') && (
                                        <button onClick={handleVerifySubmit} disabled={isSubmitting || !formData.ktp_photo_url} className="w-full md:w-auto px-10 py-4 bg-white text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all">Submit Verifikasi</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div id="basic-info-section" className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden h-full">
                    <div className="flex items-center justify-between mb-8 text-left">
                        <h3 className="text-sm font-black uppercase text-gray-900">Informasi Dasar</h3>
                        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="px-6 py-2 bg-gray-50 text-gray-400 text-[10px] font-black uppercase rounded-xl hover:bg-gray-100">{isEditing ? 'Simpan' : 'Edit'}</button>
                    </div>
                    <div className="space-y-6 text-left">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nama Panggilan</label>
                            {isEditing ? <input name="display_name" value={formData.display_name} onChange={handleInputChange} className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold" /> : <p className="font-bold">{formData.display_name || '-'}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">WhatsApp</label>
                            {isEditing ? <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-gray-50 p-4 rounded-xl outline-none font-bold" /> : <p className="font-bold">{formData.phone || '-'}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Kode Referral (Khusus Agen)</label>
                            <div className="flex items-center gap-3">
                                <p className="font-mono font-black text-orange-600 bg-orange-50 px-4 py-2.5 rounded-xl inline-block mt-1">{formData.referral_code || 'Belum Terbuat'}</p>
                                {formData.referral_code && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(formData.referral_code);
                                            alert('Kode referral berhasil disalin!');
                                        }}
                                        className="mt-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Salin
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t p-6">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px]">Batal</button>
                        <button onClick={handleSave} className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px]">Simpan Perubahan</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentProfile;
