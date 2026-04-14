'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { LOMBA_LIST } from '@/data/lomba';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
    CheckCircle, 
    UploadCloud, 
    Banknote, 
    Users, 
    User, 
    Phone, 
    Building, 
    Tag, 
    Clipboard, 
    AlertTriangle, 
    Loader2, 
    Send, 
    Trash2,
    FileText,
} from 'lucide-react';

const MotionButton = motion(Button);

type DataPendaftaran = {
    sekolah: {
        nama: string;
        pembina: string;
        whatsapp: string;
        kategori: string;
    };
    lombaDipilih: Record<string, number>;
    peserta: Record<string, string[][]>;
    totalBayar: number;
};

// Varian animasi untuk Framer Motion
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function PembayaranPage() {
    const router = useRouter();
    const [dataPendaftaran, setDataPendaftaran] = useState<DataPendaftaran | null>(null);
    const [bukti, setBukti] = useState<File | null>(null);
    const [namaPengirim, setNamaPengirim] = useState('');
    const [loading, setLoading] = useState(false);
    const [nomor, setNomor] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null); // State untuk error submit

   useEffect(() => {
    try {
        const stored = localStorage.getItem('formPendaftaran');
        if (stored) {
            const data = JSON.parse(stored);
            if (!data?.sekolah?.nama) throw new Error('Data tidak lengkap');
            setDataPendaftaran(data);

            const now = new Date();
            const offset = 7 * 60 * 60 * 1000;
            const wib = new Date(now.getTime() + offset);
            const pad = (n: number) => String(n).padStart(2, '0');
            const timestamp = `${wib.getFullYear()}${pad(wib.getMonth() + 1)}${pad(wib.getDate())}${pad(wib.getHours())}${pad(wib.getMinutes())}`;
            const nomor = `P3K2025-${data.sekolah.nama.replace(/\s+/g, '').toUpperCase().slice(0, 10)}-${timestamp}`;
            setNomor(nomor);
        } else {
            router.push('/daftar');
        }
    } catch (error) {
        console.error('Gagal parsing localStorage:', error);
        router.push('/daftar');
    }
}, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                alert('File harus berupa gambar atau PDF!');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // Batas 5MB
                alert('Ukuran file maksimal 5MB!');
                return;
            }
            setBukti(file);

            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null); 
            }
        }
    };

    const handleRemoveBukti = () => {
        setBukti(null);
        setPreviewUrl(null);
        const fileInput = document.getElementById('bukti-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
        });
    };

    const handleSubmit = async () => {
        if (!bukti || !namaPengirim.trim() || !dataPendaftaran) {
            alert('Harap lengkapi semua data dan unggah bukti!');
            return;
        }

        setLoading(true);
        setSubmitError(null); 

        try {
            // 1. Upload Bukti Pembayaran
            const buktiPath = `bukti/${nomor}_${bukti.name}`;
            const { error: uploadError } = await supabase.storage
                .from('bukti-pembayaran')
                .upload(buktiPath, bukti, { upsert: false });

            if (uploadError) throw new Error('Gagal upload bukti: ' + uploadError.message);

            const { data: urlData } = supabase.storage
                .from('bukti-pembayaran')
                .getPublicUrl(buktiPath);

            if (!urlData?.publicUrl) throw new Error('Gagal mendapatkan URL bukti.');
            const buktiUrl = urlData.publicUrl;

            // 2. Insert Pendaftaran
            const { data: pendaftaranData, error: pendaftaranError } = await supabase
                .from('pendaftaran')
                .insert([{
                    nomor,
                    nama_sekolah: dataPendaftaran.sekolah.nama,
                    pembina: dataPendaftaran.sekolah.pembina,
                    whatsapp: dataPendaftaran.sekolah.whatsapp,
                    kategori: dataPendaftaran.sekolah.kategori,
                    // ...Object.fromEntries(
                    //     Object.entries(dataPendaftaran.lombaDipilih).map(([id, jumlah]) =>
                    //         [id.replace(/-/g, '_'), jumlah]
                    //     )
                    // ),
                    lombaJson: dataPendaftaran.lombaDipilih,
                    totalBayar: dataPendaftaran.totalBayar,
                    buktiUrl: buktiUrl,
                    nama: namaPengirim
                }])
                .select('id')
                .single();

            if (pendaftaranError || !pendaftaranData?.id) {
                throw new Error('Gagal menyimpan data pendaftaran: ' + (pendaftaranError?.message || 'ID tidak ditemukan'));
            }
            const pendaftaranId = pendaftaranData.id;

            // 3. Insert Peserta
            type PesertaInsert = {
                pendaftaran_id: string;
                nama_sekolah: string;
                lomba: string;
                data_peserta: string;
            };
            const pesertaInsert: PesertaInsert[] = [];
            for (const [lombaId, timList] of Object.entries(dataPendaftaran.peserta)) {
                const lombaNama = LOMBA_LIST.find((l) => l.id === lombaId)?.nama ?? lombaId;
                for (const tim of timList) {
                    for (const nama of tim) {
                        if (nama.trim()) {
                            pesertaInsert.push({
                                pendaftaran_id: pendaftaranId,
                                nama_sekolah: dataPendaftaran.sekolah.nama,
                                lomba: lombaNama,
                                data_peserta: nama.trim()
                            });
                        }
                    }
                }
            }
            if (pesertaInsert.length > 0) {
                const { error: pesertaError } = await supabase
                    .from('peserta')
                    .insert(pesertaInsert);
                if (pesertaError) throw new Error('Gagal menyimpan data peserta: ' + pesertaError.message);
            }
            
            // 4. Panggil API Generate Kwitansi
            console.log(`Memanggil API untuk generate kwitansi: /api/generate-kwitansi?nomor=${nomor}`);
            const apiResponse = await fetch(`/api/generate-kwitansi?nomor=${nomor}`); // Panggil API

            if (!apiResponse.ok) {
                const text = await apiResponse.text();
                console.error("API Error (RAW):", text);
                throw new Error("API kwitansi gagal");
            }else {
               let apiResult;
                try {
                    apiResult = await apiResponse.json();
                } catch {
                    const text = await apiResponse.text();
                    console.error("Response bukan JSON:", text);
                    throw new Error("Response API bukan JSON");
                }
            }

            // 5. Kirim Notifikasi
            try {
                const notifikasi = await fetch('/api/notifikasi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        namaSekolah: dataPendaftaran.sekolah.nama,
                        pembina: dataPendaftaran.sekolah.pembina,
                        whatsapp: dataPendaftaran.sekolah.whatsapp,
                        buktiUrl,
                        namaPengirim,
                    })
                });
                if (!notifikasi.ok && !submitError) {
                    console.warn('Notifikasi WA gagal');
                    setSubmitError("Pendaftaran berhasil, namun notifikasi ke panitia gagal. Akan diproses manual.");
                }
            } catch (notifError) {
                console.warn('Notifikasi WA gagal total', notifError);
                if (!submitError) setSubmitError("Pendaftaran berhasil, namun notifikasi ke panitia gagal. Akan diproses manual.");
            }

            // 6. Berhasil & Redirect
            alert(`✅ Pendaftaran berhasil! ${submitError ? '\n\n' + submitError : 'Kwitansi akan segera tersedia.'}`);
            localStorage.removeItem('formPendaftaran'); 
            localStorage.removeItem('namaPengirim'); 
            
            router.push(`/kwitansi?nomor=${nomor}`); 

        } catch (err: any) {
            console.error('Error kirim:', err);
            alert('❌ Gagal mengirim data: ' + err.message);
            setSubmitError('Terjadi kesalahan. Silakan coba lagi atau hubungi panitia.');
        } finally {
            setLoading(false);
        }
    };

    if (!dataPendaftaran) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                <Loader2 className="animate-spin h-6 w-6" />
                <span className='text-lg'>Memuat data pendaftaran...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <motion.div 
                className="max-w-4xl mx-auto space-y-12"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Header Section */}
                <motion.div 
                    className="text-center space-y-4"
                    variants={itemVariants}
                >
                    <motion.div 
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-full mx-auto shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                    >
                        <Banknote className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Konfirmasi Pembayaran
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Selesaikan langkah terakhir untuk mendaftarkan tim Anda!
                    </p>
                    <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg inline-block shadow-sm">
                        No. Registrasi: <span className="font-bold text-yellow-600">{nomor}</span>
                    </div>
                </motion.div>

                {/* Main Content (Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Column: Summary & Instructions */}
                    <motion.div 
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8"
                        variants={itemVariants}
                    >
                        {/* School Info */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3 flex items-center">
                                <Building className="w-5 h-5 mr-3 text-sky-600"/>
                                Informasi Sekolah
                            </h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                {/* ... Detail Sekolah ... */}
                                <div className="flex items-start">
                                    <User className="w-4 h-4 mr-2 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                                    <div>
                                        <dt className="text-gray-500 dark:text-gray-400">Nama Sekolah</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{dataPendaftaran.sekolah.nama}</dd>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <User className="w-4 h-4 mr-2 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                                    <div>
                                        <dt className="text-gray-500 dark:text-gray-400">Nama Pembina</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{dataPendaftaran.sekolah.pembina}</dd>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Phone className="w-4 h-4 mr-2 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                                    <div>
                                        <dt className="text-gray-500 dark:text-gray-400">WhatsApp</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{dataPendaftaran.sekolah.whatsapp}</dd>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                                    <div>
                                        <dt className="text-gray-500 dark:text-gray-400">Kategori</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{dataPendaftaran.sekolah.kategori}</dd>
                                    </div>
                                </div>
                            </dl>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3 flex items-center">
                                <CheckCircle className="w-5 h-5 mr-3 text-sky-600"/>
                                Rincian Pembayaran
                            </h2>
                            <div className="space-y-3">
                                {Object.entries(dataPendaftaran.lombaDipilih).map(([id, jumlah]) => {
                                    const lomba = LOMBA_LIST.find((l) => l.id === id);
                                    return (
                                        <motion.div 
                                            key={id} 
                                            className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="flex items-center">
                                                <Users className="w-4 h-4 mr-3 text-yellow-600"/>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{lomba?.nama || id}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{jumlah} tim</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                                Rp {(jumlah * (lomba?.biaya ?? 0)).toLocaleString('id-ID')}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                                <div className="flex justify-between items-center pt-5 border-t border-gray-200 dark:border-gray-700 mt-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Pembayaran</span>
                                    <span className="text-2xl font-bold text-sky-600">
                                        Rp {dataPendaftaran.totalBayar.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bank Transfer */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-xl space-y-4 border-l-4 border-yellow-400 shadow-sm">
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                Instruksi Pembayaran
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                                    <Image 
                                        src="/bca-logo.png" 
                                        alt="BCA" 
                                        width={80} 
                                        height={32}
                                        className="h-8 w-auto flex-shrink-0"
                                    />
                                    <div className='text-gray-800 dark:text-gray-200'>
                                        <p className="font-medium">Bank Central Asia (BCA)</p>
                                        <div className="mt-1 flex items-center">
                                            <p>No. Rek: <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded">4310 6802 79</span></p>
                                            <button 
                                                onClick={() => copyToClipboard('4310680279')} 
                                                className="ml-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                                                title="Salin Nomor Rekening"
                                            >
                                                <Clipboard className="w-4 h-4"/>
                                            </button>
                                            {copied && <span className="ml-2 text-xs text-green-600">Disalin!</span>}
                                        </div>
                                        <p>A/N: <span className="font-medium">Sapriliani</span></p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 shadow-sm">
                                    <p className="text-sky-600 dark:text-sky-400 font-medium">✱ Pastikan jumlah transfer sesuai total pembayaran.</p>
                                    <p className="mt-1">✱ Simpan bukti transfer untuk diunggah.</p>
                                    <p className="mt-1">✱ Format: JPG/PNG/PDF (Maks. 5MB).</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Form */}
                    <motion.div 
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8"
                        variants={itemVariants}
                    >
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3 flex items-center">
                            <Send className="w-5 h-5 mr-3 text-sky-600"/>
                            Konfirmasi & Unggah Bukti
                        </h2>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nama Pengirim Transfer
                                    <div className="relative mt-1">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                        <Input
                                            type="text"
                                            placeholder="Nama sesuai rekening pengirim"
                                            value={namaPengirim}
                                            onChange={(e) => setNamaPengirim(e.target.value)}
                                            className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            required
                                        />
                                    </div>
                                </label>
                                
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Upload Bukti Transfer
                                    <div className="mt-1">
                                        <AnimatePresence>
                                        {bukti ? (
                                            <motion.div 
                                                className="w-full p-4 border-2 border-green-500 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-between"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <div className='flex items-center space-x-3 overflow-hidden'>
                                                    {previewUrl ? (
                                                        <Image src={previewUrl} alt="Preview Bukti" width={48} height={48} className="w-12 h-12 rounded-md object-cover"/>
                                                    ) : (
                                                        <FileText className="w-8 h-8 text-green-700 dark:text-green-300 flex-shrink-0"/>
                                                    )}
                                                    <span className="text-sm text-green-800 dark:text-green-200 truncate" title={bukti.name}>
                                                        {bukti.name}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={handleRemoveBukti} 
                                                    className="text-sky-500 hover:text-sky-700 dark:hover:text-sky-300"
                                                    title="Hapus File"
                                                >
                                                    <Trash2 className="w-5 h-5"/>
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.label 
                                                htmlFor="bukti-upload"
                                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                    <UploadCloud className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
                                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="font-semibold">Klik untuk memilih file</span> atau seret ke sini
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG, atau PDF (MAX. 5MB)</p>
                                                </div>
                                                <Input
                                                    id="bukti-upload"
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    onChange={handleUpload}
                                                    className="hidden"
                                                />
                                            </motion.label>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                </label>
                            </div>

                             {submitError && ( 
                                <motion.div
                                    className="p-4 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-lg text-sm flex items-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                                    {submitError}
                                </motion.div>
                            )}

                            <MotionButton
                                type="button"
                                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                                whileTap={{ scale: 0.97 }}
                                disabled={loading || !bukti || !namaPengirim.trim()}
                                onClick={handleSubmit}
                                className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                        Mengirim Data...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-3" />
                                        Kirim Konfirmasi Pembayaran
                                    </>
                                )}
                            </MotionButton>
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                Dengan mengklik tombol ini, Anda mengonfirmasi bahwa data yang dimasukkan dan bukti transfer adalah benar.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}