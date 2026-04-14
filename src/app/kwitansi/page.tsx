'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
    Loader2,
    AlertTriangle,
    PartyPopper,
    FileText,
    Home,
    Clock3,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

function KwitansiContent() {
    const searchParams = useSearchParams();
    const nomor = searchParams?.get('nomor');

    const [namaSekolah, setNamaSekolah] = useState<string>('');
    const [statusPembayaran, setStatusPembayaran] = useState<PaymentStatus>('PENDING');
    const [catatanAdmin, setCatatanAdmin] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // GANTI NOMOR INI DENGAN NOMOR ADMIN PANITIA
    // contoh: 081234567890 -> jadi 6281234567890
    const adminWhatsapp = '6283177642773';

    useEffect(() => {
        const fetchData = async () => {
            if (!nomor) {
                setError('Nomor registrasi tidak ditemukan di URL.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const { data, error: dbError } = await supabase
                    .from('pendaftaran')
                    .select('nama_sekolah, status_pembayaran, catatan_admin')
                    .eq('nomor', nomor)
                    .single();

                if (dbError) {
                    throw new Error('Gagal mengambil data dari database: ' + dbError.message);
                }

                if (!data) {
                    setError('Data pendaftaran dengan nomor ini tidak ditemukan.');
                    return;
                }

                setNamaSekolah(data.nama_sekolah || 'Peserta');
                setStatusPembayaran((data.status_pembayaran as PaymentStatus) || 'PENDING');
                setCatatanAdmin(data.catatan_admin || '');
            } catch (err: any) {
                console.error('Fetch Kwitansi Error:', err);
                setError(err.message || 'Terjadi kesalahan saat mengambil status pendaftaran.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [nomor]);

    const getStatusConfig = () => {
        switch (statusPembayaran) {
            case 'APPROVED':
                return {
                    label: 'Pembayaran Diterima',
                    description: 'Pembayaran Anda telah diverifikasi admin.',
                    icon: <CheckCircle2 className="w-5 h-5 mr-2" />,
                    badgeClass: 'bg-green-100 text-green-700 border border-green-200',
                    noteClass: 'text-green-700 dark:text-green-400',
                };
            case 'REJECTED':
                return {
                    label: 'Pembayaran Ditolak',
                    description: 'Pembayaran Anda ditolak admin. Silakan cek catatan admin di bawah.',
                    icon: <XCircle className="w-5 h-5 mr-2" />,
                    badgeClass: 'bg-red-100 text-red-700 border border-red-200',
                    noteClass: 'text-red-700 dark:text-red-400',
                };
            default:
                return {
                    label: 'Menunggu Verifikasi',
                    description: 'Bukti pembayaran Anda sudah masuk dan sedang diperiksa admin.',
                    icon: <Clock3 className="w-5 h-5 mr-2" />,
                    badgeClass: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
                    noteClass: 'text-yellow-700 dark:text-yellow-400',
                };
        }
    };

    const statusConfig = getStatusConfig();

    if (loading) {
        return (
            <div className="text-center text-gray-600 dark:text-gray-300">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-sky-600" />
                <h1 className="text-xl font-semibold">Memuat Status Pendaftaran...</h1>
                <p className="text-sm">Mohon tunggu sebentar.</p>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl text-center border-t-4 border-sky-500"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <AlertTriangle className="w-16 h-16 text-sky-500 mx-auto mb-5" />
                <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Terjadi Kesalahan</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>

                <div className="flex flex-col gap-3">
                    <a
                        href={`https://wa.me/${adminWhatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-white font-medium hover:bg-green-700 transition"
                    >
                        Hubungi Admin via WhatsApp
                    </a>

                    <Link href="/" passHref>
                        <Button variant="outline" className="w-full">
                            <Home className="w-4 h-4 mr-2" /> Kembali ke Beranda
                        </Button>
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-10 max-w-lg w-full shadow-2xl text-center relative overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            <PartyPopper className="w-16 h-16 text-yellow-500 mx-auto mb-4" />

            <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                Status Pendaftaran Anda
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Terima kasih, {namaSekolah}!
            </p>

            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-4 ${statusConfig.badgeClass}`}>
                {statusConfig.icon}
                {statusConfig.label}
            </div>

            <p className={`text-sm mb-6 ${statusConfig.noteClass}`}>
                {statusConfig.description}
            </p>

            <motion.div
                className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-600 shadow-inner flex flex-col items-center"
                whileHover={{ scale: 1.02 }}
            >
                <FileText className="w-20 h-20 text-sky-500 mb-4" />
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    Nomor Pendaftaran
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 break-all">
                    {nomor}
                </p>
            </motion.div>

            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-6 py-5 text-center">
                {statusPembayaran === 'PENDING' && (
                    <div className="space-y-2">
                        <p className="font-semibold text-yellow-700">
                            Pendaftaran Anda berhasil dikirim.
                        </p>
                        <p className="text-sm text-gray-600">
                            Bukti pembayaran Anda sedang diperiksa admin. Mohon tunggu verifikasi.
                        </p>
                        <p className="text-sm text-gray-600">
                            Kwitansi akan dikirim oleh admin melalui WhatsApp yang Anda daftarkan.
                        </p>
                        <p className="text-sm text-gray-600">
                            Anda tidak perlu menunggu di halaman ini terus.
                        </p>
                    </div>
                )}

                {statusPembayaran === 'APPROVED' && (
                    <div className="space-y-2">
                        <p className="font-semibold text-green-700">
                            Pembayaran Anda telah diverifikasi.
                        </p>
                        <p className="text-sm text-gray-600">
                            Kwitansi akan dikirim oleh admin melalui WhatsApp yang Anda daftarkan.
                        </p>
                        <p className="text-sm text-gray-600">
                            Silakan tunggu pesan dari panitia.
                        </p>
                    </div>
                )}

                {statusPembayaran === 'REJECTED' && (
                    <div className="space-y-2">
                        <p className="font-semibold text-red-700">
                            Pembayaran Anda ditolak.
                        </p>
                        <p className="text-sm text-gray-600">
                            Silakan cek catatan admin atau hubungi panitia untuk informasi lebih lanjut.
                        </p>
                    </div>
                )}
            </div>

            {statusPembayaran === 'REJECTED' && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                    <p className="font-semibold text-red-700 mb-1">Catatan Admin:</p>
                    <p className="text-sm text-red-600">
                        {catatanAdmin || 'Silakan hubungi panitia untuk informasi lebih lanjut.'}
                    </p>
                </div>
            )}

            <a
                href={`https://wa.me/${adminWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-white font-medium hover:bg-green-700 transition"
            >
                Hubungi Admin via WhatsApp
            </a>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                {statusPembayaran === 'PENDING' && 'Status pembayaran Anda masih menunggu verifikasi admin.'}
                {statusPembayaran === 'APPROVED' && 'Kwitansi akan dikirim admin melalui WhatsApp yang terdaftar.'}
                {statusPembayaran === 'REJECTED' && 'Silakan hubungi admin panitia jika membutuhkan bantuan lebih lanjut.'}
            </p>

            <Link
                href="/"
                className="mt-4 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
                <Home className="w-4 h-4 mr-1" />
                Kembali ke Beranda
            </Link>
        </motion.div>
    );
}

export default function KwitansiPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-100 dark:from-gray-900 dark:via-sky-900/50 dark:to-gray-900">
            <Suspense
                fallback={
                    <div className="text-center text-gray-600 dark:text-gray-300">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-sky-600" />
                        <h1 className="text-xl font-semibold">Memuat Halaman...</h1>
                    </div>
                }
            >
                <KwitansiContent />
            </Suspense>

            <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
                KSR PMI Unit Universitas Suryakancana &copy; 2025
            </p>
        </div>
    );
}