import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../supabase';
import { Plus, Edit2, Trash2, Eye, FileText, CheckCircle, AlertCircle, RefreshCcw, Save, X, HelpCircle, Code } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ArticleDb {
  id?: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  read_time: string;
  icon: string;
  gradient: string;
  content: string;
  status: 'draft' | 'published';
  created_at?: string;
}

const GRADIENTS = [
  { name: 'Orange-Amber', class: 'from-orange-500 to-amber-400' },
  { name: 'Blue-Cyan', class: 'from-blue-500 to-cyan-400' },
  { name: 'Purple-Pink', class: 'from-purple-500 to-pink-400' },
  { name: 'Emerald-Teal', class: 'from-emerald-500 to-teal-400' },
  { name: 'Slate-Dark', class: 'from-slate-700 to-slate-900' },
];

const CATEGORIES = ['Edukasi', 'Panduan', 'Berita', 'Tips', 'Bisnis', 'Lainnya'];

const ArticleManagement: React.FC = () => {
  const [articles, setArticles] = useState<ArticleDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Edukasi');
  const [author, setAuthor] = useState('Admin RuangSinggah');
  const [icon, setIcon] = useState('📝');
  const [gradient, setGradient] = useState('from-orange-500 to-amber-400');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [readTime, setReadTime] = useState('5 Menit');
  
  // Editor view
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const reactQuillRef = useRef<ReactQuill>(null);

  const fetchArticles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist, we inform the admin to create it
        if (error.code === 'P0001' || error.message.includes('relation "articles" does not exist')) {
          setErrorMsg('Tabel "articles" belum terpasang di database Supabase Anda. Harap jalankan kode migrasi SQL terlebih dahulu.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setArticles(data || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat artikel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Auto-generate slug and reading time
  useEffect(() => {
    if (!editingId) {
      const cleanedTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // trim double hyphens
      setSlug(cleanedTitle);
    }
  }, [title, editingId]);

  useEffect(() => {
    // Basic word-based read time calculator
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setReadTime(`${minutes} Menit`);
  }, [content]);

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setCategory('Edukasi');
    setAuthor('Admin RuangSinggah');
    setIcon('📝');
    setGradient('from-orange-500 to-amber-400');
    setContent('');
    setStatus('draft');
    setEditorTab('write');
    setShowForm(true);
  };

  const handleOpenEdit = (art: ArticleDb) => {
    setEditingId(art.id || null);
    setTitle(art.title);
    setSlug(art.slug);
    setDescription(art.description);
    setCategory(art.category);
    setAuthor(art.author);
    setIcon(art.icon);
    setGradient(art.gradient);
    setContent(art.content);
    setStatus(art.status);
    setEditorTab('write');
    setShowForm(true);
  };

  const handleImageUploadQuill = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsUploadingImg(true);
      setErrorMsg('');
      setInfoMsg('');

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `article_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `articles/${fileName}`;

        // Upload to 'banners' bucket
        const { data, error: uploadError } = await supabase.storage
          .from('banners')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(data.path);

        // Get Quill instance and insert image
        const quill = reactQuillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          const insertIdx = range?.index ?? quill.getLength();
          quill.insertEmbed(insertIdx, 'image', publicUrl);
          quill.setSelection(insertIdx + 1);
        }
        
        setInfoMsg('Gambar berhasil diunggah!');
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal mengunggah gambar.');
      } finally {
        setIsUploadingImg(false);
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUploadQuill
      }
    }
  }), []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content || !description) {
      alert('Harap isi semua kolom wajib (Judul, Ringkasan, Konten).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setInfoMsg('');

    const payload: ArticleDb = {
      slug,
      title,
      description,
      category,
      author,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      read_time: readTime,
      icon,
      gradient,
      content,
      status
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('articles')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        setInfoMsg('Artikel berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([payload]);
        if (error) throw error;
        setInfoMsg('Artikel baru berhasil dipublikasikan!');
      }
      setShowForm(false);
      fetchArticles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan artikel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus artikel ini permanen?')) return;
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setInfoMsg('Artikel berhasil dihapus!');
      fetchArticles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus artikel.');
    }
  };

  const handleSetupTable = async () => {
    alert('Silakan salin instruksi SQL di tab panduan dan jalankan pada menu SQL Editor di Supabase Console Anda.');
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/40">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            📰 CMS & Kelola Artikel
          </h2>
          <p className="text-xs text-gray-500 font-bold mt-1">
            Tulis dan kelola artikel pilar untuk meningkatkan optimasi SEO Google dan pembacaan AI Generatif (GEO).
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-gray-900/10"
          >
            <Plus className="w-4 h-4" /> Tulis Artikel
          </button>
        )}
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
            {errorMsg.includes('Tabel "articles"') && (
              <button 
                onClick={handleSetupTable}
                className="mt-2 text-[10px] font-black text-red-800 bg-red-100/50 hover:bg-red-100 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
              >
                Lihat Skema SQL
              </button>
            )}
          </div>
        </div>
      )}

      {infoMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center gap-3 animate-pulse">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">{infoMsg}</p>
        </div>
      )}

      {/* ARTICLE WRITING FORM VIEW */}
      {showForm ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Detail Informasi Artikel</span>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-wider flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Batal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Judul */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Judul Artikel *</label>
                <input
                  type="text"
                  placeholder="Misalnya: Cara Kerja Jasa Survey Kost RuangSinggah"
                  className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-800 focus:border-orange-500 transition-colors"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Slug URL (Auto-Generated) *</label>
                <input
                  type="text"
                  placeholder="cara-kerja-jasa-survey-kost"
                  className="w-full bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-500"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kategori */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kategori</label>
                <select
                  className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-800 focus:border-orange-500 transition-colors"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Cover Gradient */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tampilan Warna Cover</label>
                <select
                  className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-800 focus:border-orange-500 transition-colors"
                  value={gradient}
                  onChange={e => setGradient(e.target.value)}
                >
                  {GRADIENTS.map(grad => (
                    <option key={grad.class} value={grad.class}>{grad.name}</option>
                  ))}
                </select>
              </div>

              {/* Icon / Emoji */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Icon / Emoji Cover</label>
                <input
                  type="text"
                  placeholder="🏢"
                  maxLength={5}
                  className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-800 focus:border-orange-500 transition-colors text-center"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Penulis */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Penulis / Author</label>
                <input
                  type="text"
                  className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-800 focus:border-orange-500 transition-colors"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status Publikasi</label>
                <select
                  className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-800 focus:border-orange-500 transition-colors"
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                >
                  <option value="draft">Simpan sebagai Draft</option>
                  <option value="published">Langsung Publikasikan</option>
                </select>
              </div>

              {/* Waktu Baca */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimasi Waktu Baca (Auto)</label>
                <input
                  type="text"
                  disabled
                  className="w-full bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-500 text-center"
                  value={readTime}
                />
              </div>
            </div>

            {/* Ringkasan Meta SEO */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ringkasan Deskripsi / Meta SEO *</label>
              <textarea
                rows={2}
                placeholder="Tulis 1-2 kalimat ringkasan artikel untuk deskripsi meta SEO dan Google snippet..."
                className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 outline-none text-xs font-bold text-gray-800 focus:border-orange-500 transition-colors resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          {/* EDITING INTERACTIVE CONTENT BOX */}
          <div className="space-y-3">
            <style>{`
              .ql-editor {
                min-height: 380px;
                font-family: inherit;
                font-size: 0.875rem;
                line-height: 1.7;
              }
              .ql-toolbar {
                border-top-left-radius: 1.5rem !important;
                border-top-right-radius: 1.5rem !important;
                border-color: #e2e8f0 !important;
                background-color: #f8fafc;
              }
              .ql-container {
                border-bottom-left-radius: 1.5rem !important;
                border-bottom-right-radius: 1.5rem !important;
                border-color: #e2e8f0 !important;
                border-top: none !important;
              }
            `}</style>

            <div className="flex items-center justify-between bg-gray-100 p-2 rounded-2xl">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditorTab('write')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${editorTab === 'write' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  📝 Editor Visual
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${editorTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  👁️ Real-time Preview
                </button>
              </div>
              {isUploadingImg && (
                <span className="text-[10px] font-black text-orange-600 animate-pulse uppercase tracking-widest mr-3">
                  Mengunggah gambar...
                </span>
              )}
            </div>

            {/* Writer area */}
            {editorTab === 'write' ? (
              <div className="bg-white rounded-3xl overflow-hidden">
                <ReactQuill
                  ref={reactQuillRef}
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  placeholder="Tulis konten artikel Anda di sini..."
                />
              </div>
            ) : (
              /* Real-time HTML Preview block */
              <div className="bg-white p-8 rounded-3xl border border-gray-200 min-h-[350px] overflow-y-auto max-h-[500px]">
                <div className="border-b border-gray-100 pb-6 mb-8 text-center">
                  <div className="inline-block bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">{category}</div>
                  <h1 className="text-3xl font-black text-gray-900 leading-tight uppercase mb-4">{title || 'JUDUL ARTIKEL AKAN MUNCUL DI SINI'}</h1>
                  <div className="flex justify-center gap-4 text-xs text-gray-400 font-bold">
                    <span>Oleh: {author}</span>
                    <span>Waktu baca: {readTime}</span>
                  </div>
                </div>
                <div className="prose prose-orange max-w-none">
                  {content ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p className="text-gray-400 font-medium italic text-center py-10">Belum ada konten tertulis. Mulai menulis di tab Editor.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-orange-500/20 disabled:opacity-55"
            >
              <Save className="w-4 h-4" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Artikel'}
            </button>
          </div>
        </form>
      ) : (
        /* ARTICLES INDEX GRID */
        <div className="space-y-6">
          <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Informasi Skema Database</p>
                <p className="text-xs text-gray-600 font-medium leading-relaxed mt-0.5">
                  CMS ini membaca tabel `articles` dari Supabase. Anda dapat menambahkan konten di sini untuk ditampilkan di web utama.
                </p>
              </div>
            </div>
            <button
              onClick={fetchArticles}
              className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-orange-500 text-gray-500 hover:text-orange-500 rounded-xl transition-all shadow-sm shrink-0"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <span className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-orange-500 animate-spin inline-block" />
              <p className="text-xs text-gray-400 font-bold mt-3">Memuat database artikel...</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="py-4 px-3">Visual</th>
                    <th className="py-4 px-3">Judul Artikel</th>
                    <th className="py-4 px-3">Kategori</th>
                    <th className="py-4 px-3">Penulis</th>
                    <th className="py-4 px-3">Waktu Baca</th>
                    <th className="py-4 px-3">Status</th>
                    <th className="py-4 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {articles.map(art => (
                    <tr key={art.slug} className="hover:bg-gray-50/50 transition-colors">
                      {/* Visual Cover preview */}
                      <td className="py-4 px-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${art.gradient} rounded-lg flex items-center justify-center text-lg text-white`}>
                          {art.icon}
                        </div>
                      </td>
                      {/* Judul & Slug */}
                      <td className="py-4 px-3">
                        <p className="text-xs font-black text-gray-900 line-clamp-1">{art.title}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-0.5">/{art.slug}</p>
                      </td>
                      {/* Kategori */}
                      <td className="py-4 px-3">
                        <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">{art.category}</span>
                      </td>
                      {/* Penulis */}
                      <td className="py-4 px-3">
                        <p className="text-xs font-bold text-gray-600">{art.author}</p>
                      </td>
                      {/* Waktu Baca */}
                      <td className="py-4 px-3">
                        <p className="text-xs font-bold text-gray-500">{art.read_time}</p>
                      </td>
                      {/* Status */}
                      <td className="py-4 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${art.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {art.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(art)}
                            className="p-2 bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-500 rounded-xl transition-colors"
                            title="Edit Artikel"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(art.id!)}
                            className="p-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-xl transition-colors"
                            title="Hapus Artikel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">Belum ada artikel di database.</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Klik tombol "Tulis Artikel" di atas untuk membuat postingan editorial pertama Anda.</p>
            </div>
          )}
        </div>
      )}

      {/* SQL SCHEMA PANDUAN */}
      <details className="mt-12 border-t border-gray-100 pt-8 group">
        <summary className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest cursor-pointer list-none flex items-center gap-1.5 selection:bg-transparent">
          <Code className="w-4 h-4 text-orange-500" /> Skema Migrasi SQL Supabase (Klik untuk membuka)
        </summary>
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Agar CMS ini dapat menyimpan data secara persisten ke database Supabase Anda, buka menu **SQL Editor** di dashboard Supabase lalu salin dan jalankan skrip berikut:
          </p>
          <pre className="bg-gray-900 text-gray-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-white/5 max-h-[300px]">
{`-- 1. Buat Tabel Articles
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    date TEXT NOT NULL,
    read_time TEXT NOT NULL,
    icon TEXT NOT NULL,
    gradient TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Public READ, Admin WRITE)
-- Kebijakan Membaca (Untuk Semua Pengunjung)
CREATE POLICY "Allow public read access to published articles"
ON public.articles
FOR SELECT
USING (status = 'published');

-- Kebijakan Menulis (Untuk Semua/Admin sesuai otentikasi)
CREATE POLICY "Allow all operations for authenticated admin"
ON public.articles
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');`}
          </pre>
        </div>
      </details>

    </div>
  );
};

export default ArticleManagement;
