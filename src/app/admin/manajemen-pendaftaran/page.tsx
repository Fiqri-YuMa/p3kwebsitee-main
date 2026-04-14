'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Pendaftaran = {
    id: number;
    nama_sekolah: string;
    nomor: string;
    totalBayar: number;
    status_pembayaran: string;
    buktiUrl: string | null;
    kwitansi_url: string | null;
    whatsapp: string | null;
};

export default function ManajemenPendaftaranPage() {
    const [data, setData] = useState<Pendaftaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('pendaftaran')
            .select('id, nama_sekolah, nomor, totalBayar, status_pembayaran, buktiUrl, kwitansi_url, whatsapp')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Gagal mengambil data pendaftaran:', error.message);
        } else {
            setData(data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStatus = async (
        id: number,
        status: 'APPROVED' | 'REJECTED',
        note: string | null = null
    ) => {
        setUpdatingId(id);

        const { error } = await supabase
            .from('pendaftaran')
            .update({
                status_pembayaran: status,
                catatan_admin: note,
            })
            .eq('id', id);

        if (error) {
            alert('Gagal update status: ' + error.message);
        } else {
            await fetchData();
        }

        setUpdatingId(null);
    };

    const handleReject = async (id: number) => {
        const alasan = window.prompt(
            'Masukkan alasan penolakan pembayaran:',
            'Bukti pembayaran tidak valid'
        );

        if (alasan === null) return;

        await updateStatus(id, 'REJECTED', alasan);
    };

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') {
            return (
                <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    APPROVED
                </span>
            );
        }

        if (status === 'REJECTED') {
            return (
                <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    REJECTED
                </span>
            );
        }

        return (
            <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                PENDING
            </span>
        );
    };

    const formatWhatsappLink = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.startsWith('0')) {
            return `62${cleaned.slice(1)}`;
        }

        if (cleaned.startsWith('62')) {
            return cleaned;
        }

        return cleaned;
    };

    if (loading) {
        return <p className="p-6">Loading...</p>;
    }

    return (
        <div className="p-6 bg-sky-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-slate-800">Manajemen Pendaftaran</h1>

            <div className="overflow-x-auto bg-white rounded-xl shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3">Sekolah</th>
                            <th className="p-3">Nomor</th>
                            <th className="p-3">No. WA</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Bukti Bayar</th>
                            <th className="p-3">Kwitansi</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id} className="border-t align-top">
                                <td className="p-3">{item.nama_sekolah}</td>
                                <td className="p-3">{item.nomor}</td>
                                <td className="p-3">
                                    {item.whatsapp ? (
                                        <div className="flex flex-col gap-2">
                                            <span>{item.whatsapp}</span>
                                            <a
                                                href={`https://wa.me/${formatWhatsappLink(item.whatsapp)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:underline"
                                            >
                                                Chat WA
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="text-red-500">Tidak ada nomor</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    Rp {(item.totalBayar || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="p-3">
                                    {item.buktiUrl ? (
                                        <a
                                            href={item.buktiUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            Lihat Bukti
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">Tidak ada</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {item.kwitansi_url ? (
                                        <a
                                            href={item.kwitansi_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="inline-block px-3 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
                                        >
                                            Download PDF
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">Belum ada</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {getStatusBadge(item.status_pembayaran || 'PENDING')}
                                </td>
                                <td className="p-3">
                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                        <button
                                            onClick={() => updateStatus(item.id, 'APPROVED')}
                                            disabled={updatingId === item.id || item.status_pembayaran === 'APPROVED'}
                                            className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50"
                                        >
                                            ACC
                                        </button>

                                        <button
                                            onClick={() => handleReject(item.id)}
                                            disabled={updatingId === item.id}
                                            className="bg-red-600 text-white px-3 py-2 rounded disabled:opacity-50"
                                        >
                                            Tolak
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}