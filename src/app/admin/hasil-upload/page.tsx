'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { Trophy, School, Hash, UploadCloud } from 'lucide-react';

const lombaList = [
  'Tandu Putra',
  'Tandu Putri',
  'Pertolongan Pertama',
  'Senam Poco Poco',
  'Mojang Jajaka',
  'Poster',
  'PMR Cerdas',
];

const HasilUploadPage = () => {
  const [mata_lomba, setLomba] = useState('');
  const [nama_sekolah, setNamaSekolah] = useState('');
  const [nomor_urut, setNomorUrut] = useState('');
  const [file_path, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { showToast } = useToast();

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0] || null;
  setFile(selectedFile);

  if (selectedFile) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string); // base64 encoded image preview
    };
    reader.readAsDataURL(selectedFile);
  } else {
    setPreview(null);
  }
};

const handleUpload = async () => {
  if (!mata_lomba || !nama_sekolah || !nomor_urut || !file_path) {
    showToast({
      message: 'Semua bidang wajib diisi dan file harus dipilih.',
      title: 'Gagal Upload',
      variant: 'error',
    });
    return;
  }

  setLoading(true);

  const fileExt = file_path.name.split('.').pop();
  if (!fileExt) {
    showToast({
      title: 'Error',
      message: 'Gagal membaca ekstensi file. Pastikan file valid.',
      variant: 'error',
    });
    setLoading(false);
    return;
  }

  // Format nama file tanpa encoding
  const sanitizedLomba = mata_lomba.replace(/\s+/g, '_'); // "Tandu Putra" -> "Tandu_Putra"
  const sanitizedSekolah = nama_sekolah.replace(/\s+/g, '_'); // "SMKN 1 CIANJUR" -> "SMKN_1_CIANJUR"
  const fileName = `${sanitizedLomba}/${sanitizedSekolah}-${nomor_urut}.${fileExt}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('hasil-akhir')
    .upload(fileName, file_path, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    showToast({
      message: 'Gagal mengunggah file: ' + uploadError.message,
      title: 'Error Upload',
      variant: 'error',
    });
    setLoading(false);
    return;
  }

  // Dapatkan public URL
  const { data: urlData } = supabase.storage
    .from('hasil-akhir')
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    showToast({
      title: 'Gagal Mendapatkan URL',
      message: 'Tidak bisa mendapatkan URL file publik.',
      variant: 'error',
    });
    setLoading(false);
    return;
  }

  // Simpan metadata ke tabel `hasil_akhir`
  const { error: dbError } = await supabase
    .from('hasil_akhir')
    .insert([{
      mata_lomba: sanitizedLomba,
      nama_sekolah: sanitizedSekolah,
      nomor_urut,
      file_path: fileName,
      file_extension: fileExt,
    }]);

  if (dbError) {
    showToast({
      message: 'Gagal menyimpan metadata: ' + dbError.message,
      title: 'Error Database',
      variant: 'error',
    });
  } else {
    showToast({
      message: 'Berhasil mengunggah file hasil akhir!',
      title: 'Upload Sukses',
      variant: 'success',
    });

    // Reset form
    setLomba('');
    setNamaSekolah('');
    setNomorUrut('');
    setFile(null);
    setPreview(null);
  }

  setLoading(false);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0F1419] to-[#1E293B] py-12 md:py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 md:p-8 shadow-lg">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-sky-400/10 px-4 py-1 rounded-full border border-sky-400/20 mb-4">
              <Trophy className="h-5 w-5 text-sky-400" />
              <span className="text-sm text-sky-300">P3K 2026</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-400 to-cyan-500 bg-clip-text text-transparent mb-2">
              Upload Hasil Akhir
            </h1>
            <p className="text-gray-300 text-sm">Unggah hasil karya peserta sesuai ketentuan</p>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            {/* Mata Lomba */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sky-300">Mata Lomba</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-sky-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <select
                  value={mata_lomba}
                  onChange={(e) => setLomba(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/5 text-gray-200"
                  required
                >
                  <option value="">Pilih Mata Lomba</option>
                  {lombaList.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nama Sekolah */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sky-300">Nama Sekolah</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-sky-400">
                  <School className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={nama_sekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/5 text-gray-200"
                  placeholder="Nama sekolah"
                  required
                />
              </div>
            </div>

            {/* Nomor Urut */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sky-300">Nomor Urut</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-sky-400">
                  <Hash className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={nomor_urut}
                  onChange={(e) => setNomorUrut(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/5 text-gray-200"
                  placeholder="Contoh: 12"
                  required
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sky-300">Unggah Karya</label>
              <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                required
                capture={/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? "environment" : undefined}
              />
              <label 
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/20 rounded-lg bg-white/5 hover:border-sky-400 transition-colors cursor-pointer"
              >
                <UploadCloud className="h-8 w-8 text-sky-400 mb-2" />
                <span className="text-gray-300 text-sm text-center px-4">
                  {file_path ? file_path.name : 'Klik untuk memilih file'}
                </span>
                <span className="text-gray-400 text-xs mt-1">(Maks. 5MB)</span>
              </label>
            </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-sky-300">Pratinjau:</p>
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/10">
                  <Image
                    src={preview}
                    alt={`Preview karya ${nama_sekolah}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                onClick={handleUpload} 
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-700 hover:from-sky-700 hover:to-cyan-800 text-white rounded-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengunggah...
                  </span>
                ) : (
                  'Upload Sekarang'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HasilUploadPage;