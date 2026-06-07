'use client';

import { useEffect, useState, useMemo } from 'react'; // <-- Tambahkan useMemo
import { supabase } from '@/lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import {
    DollarSign, Users, Home, RefreshCw, BarChart3, PieChart as PieIcon,
    Users2, Trophy, Share2, Filter // <-- Tambahkan ikon Filter
} from 'lucide-react';

// --- Tipe Data (Sama) ---
interface Pendaftaran {
    id: string;
    kategori: string;
    nama_sekolah: string;
    createdAt: string;

    total: number;

    tandu_putra: number;
    tandu_putri: number;
    pertolongan_pertama: number;
    senam_poco_poco: number;
    mojang_jajaka: number;
    poster: number;
    pmr_cerdas: number;
}

// --- Data Peserta per Tim (Sama) ---
const pesertaPerTim = {
    tandu_putra: 2,
    tandu_putri: 2,
    pertolongan_pertama: 4,
    senam_poco_poco: 10,
    mojang_jajaka: 2,
    poster: 3,
    pmr_cerdas: 3,
};

// --- Nama Lomba yang Lebih Baik (Sama) ---
const lombaNames: Record<string, string> = {
    tandu_putra: 'Tandu Putra',
    tandu_putri: 'Tandu Putri',
    pertolongan_pertama: 'Pertolongan Pertama',
    senam_poco_poco: 'Senam Poco-Poco',
    mojang_jajaka: 'Mojang Jajaka',
    poster: 'Poster',
    pmr_cerdas: 'PMR Cerdas',
};

// --- Palet Warna Modern & Menarik (Sama) ---
const COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899',
];

// --- Komponen Kartu Statistik (Sama) ---
const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string; }) => (
    <motion.div
        className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        whileHover={{ scale: 1.03 }}
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/30`}>
                {icon}
            </div>
        </div>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
    </motion.div>
);

// --- Komponen Chart Wrapper (Sama) ---
const ChartCard = ({ title, children, icon }: { title: string; children: React.ReactNode, icon: React.ReactNode }) => (
    <motion.div
        className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <h3 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        <div className="h-80 sm:h-96">
            {children}
        </div>
    </motion.div>
);

// --- Fungsi Helper Kalkulasi ---
const calculateStats = (data: Pendaftaran[]) => {
    const totalTim = Object.keys(pesertaPerTim).reduce((total, lombaKey) =>
        total + data.reduce((sum, row) => sum + (row[lombaKey as keyof Pendaftaran] as number || 0), 0)
        , 0);

    const totalParticipants = Object.keys(pesertaPerTim).reduce((total, lombaKey) =>
        total + data.reduce((sum, row) => sum + ((row[lombaKey as keyof Pendaftaran] as number || 0) * pesertaPerTim[lombaKey as keyof typeof pesertaPerTim]), 0)
        , 0);

    const pesertaPerLomba = Object.keys(pesertaPerTim).map((key) => ({
        name: lombaNames[key],
        value: data.reduce((sum, row) => sum + ((row[key as keyof Pendaftaran] as number || 0) * pesertaPerTim[key as keyof typeof pesertaPerTim]), 0),
    }));

    const timPerLomba = Object.keys(pesertaPerTim).map((key) => ({
        name: lombaNames[key],
        value: data.reduce((sum, row) => sum + (row[key as keyof Pendaftaran] as number || 0), 0),
    }));

    return { totalTim, totalParticipants, pesertaPerLomba, timPerLomba };
};

export default function Statistics() {
    const [data, setData] = useState<Pendaftaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKategori, setSelectedKategori] = useState('Semua'); // <-- State Baru

const fetchData = async () => {
    setLoading(true);

    try {
        const { data: pendaftar, error } = await supabase
            .from('pendaftaran')
            .select('*')
            .order('createdAt', { ascending: true });

        if (error) throw error;

        const normalizedData = (pendaftar || []).map((row: any) => {
            let lomba = {};

            try {
                lomba = JSON.parse(row.lombaJson || '{}');
            } catch {
                lomba = {};
            }

            return {
                id: row.id,
                kategori: row.kategori,
                nama_sekolah: row.nama_sekolah,
                createdAt: row.createdAt,

                total: row.totalBayar || 0,

                tandu_putra: Number(lomba["tandu_putra"] || 0),
                tandu_putri: Number(lomba["tandu_putri"] || 0),
                pertolongan_pertama: Number(lomba["pertolongan_pertama"] || 0),
                senam_poco_poco: Number(lomba["senam_poco_poco"] || 0),
                mojang_jajaka: Number(lomba["mojang_jajaka"] || 0),
                poster: Number(lomba["poster"] || 0),
                pmr_cerdas: Number(lomba["pmr_cerdas"] || 0),
            };
        });

        setData(normalizedData as Pendaftaran[]);
    } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal memuat data statistik');
    }

    setLoading(false);
};

    useEffect(() => {
        fetchData();
    }, []);

    // --- Kalkulasi Data Global (Sama) ---
    const totalIncome = data.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalSchools = data.length;
    const { totalTim: globalTotalTim, totalParticipants: globalTotalParticipants } = calculateStats(data);

    const formattedTotalIncome = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(totalIncome);

    // --- Filter Data Berdasarkan Kategori (Baru) ---
    const filteredData = useMemo(() => {
        if (selectedKategori === 'Semua') {
            return data;
        }
        return data.filter(item => item.kategori === selectedKategori);
    }, [data, selectedKategori]);

    // --- Data untuk Charts (Menggunakan filteredData) ---
    const pesertaPerLombaData = useMemo(() => Object.keys(pesertaPerTim).map((key, index) => ({
        name: lombaNames[key],
        value: filteredData.reduce((sum, row) => sum + ((row[key as keyof Pendaftaran] as number || 0) * pesertaPerTim[key as keyof typeof pesertaPerTim]), 0),
        fill: COLORS[index % COLORS.length],
    })), [filteredData]);

    const timPerLombaData = useMemo(() => Object.keys(pesertaPerTim).map((key, index) => ({
        name: lombaNames[key],
        value: filteredData.reduce((sum, row) => sum + (row[key as keyof Pendaftaran] as number || 0), 0),
        fill: COLORS[(index + 2) % COLORS.length],
    })), [filteredData]);

    // Data Kategori Tetap Global
    const kategoriData = [
        { name: 'Wira', value: data.filter(row => row.kategori === 'Wira').length },
        { name: 'Madya', value: data.filter(row => row.kategori === 'Madya').length },
    ];

    // --- Data untuk Loading Skeletons (Sama) ---
    const renderSkeletons = (count: number, heightClass = "h-40") => (
        Array(count).fill(0).map((_, i) => (
            <Skeleton key={i} className={`${heightClass} w-full bg-slate-200 dark:bg-slate-700 rounded-2xl`} />
        ))
    );

    // --- Fungsi Share ke WhatsApp (Diperbarui) ---
    const handleShareToWhatsApp = () => {
        if (loading || data.length === 0) {
            toast.warn("Data belum siap untuk dibagikan.");
            return;
        }

        const today = new Date().toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Hitung statistik per kategori
        const dataWira = data.filter(item => item.kategori === 'Wira');
        const dataMadya = data.filter(item => item.kategori === 'Madya');
        const statsWira = calculateStats(dataWira);
        const statsMadya = calculateStats(dataMadya);

        const createLombaString = (stats: { pesertaPerLomba: { name: string; value: number }[]; timPerLomba: { name: string; value: number }[] }) => {
            let lombaStr = '';
            Object.keys(lombaNames).forEach(key => {
                const lombaName = lombaNames[key];
                const tim = stats.timPerLomba.find(t => t.name === lombaName)?.value || 0;
                const peserta = stats.pesertaPerLomba.find(p => p.name === lombaName)?.value || 0;
                if (tim > 0) {
                    lombaStr += `- ${lombaName}: ${tim} Tim (${peserta} Peserta)\n`;
                }
            });
            return lombaStr.trim() || '_Tidak ada pendaftar_';
        };

        const message = `
*📊 Ringkasan Statistik Pendaftaran P3K 2026*
_(Update: ${today})_

*-- RINGKASAN GLOBAL --*
💰 *Total Pendapatan:* ${formattedTotalIncome}
🏫 *Total Sekolah:* ${totalSchools}
🏅 *Total Tim:* ${globalTotalTim}
👥 *Total Peserta:* ${globalTotalParticipants.toLocaleString('id-ID')}

---

*⭐ KATEGORI WIRA (${dataWira.length} Sekolah) ⭐*
👥 *Total Peserta:* ${statsWira.totalParticipants.toLocaleString('id-ID')}
🏅 *Total Tim:* ${statsWira.totalTim}
*Rincian Lomba:*
${createLombaString(statsWira)}

---

*🔸 KATEGORI MADYA (${dataMadya.length} Sekolah) 🔸*
👥 *Total Peserta:* ${statsMadya.totalParticipants.toLocaleString('id-ID')}
🏅 *Total Tim:* ${statsMadya.totalTim}
*Rincian Lomba:*
${createLombaString(statsMadya)}

---

*_P3K 2026 WELL_*
        `;

        const cleanMessage = message.split('\n').map(line => line.trim()).join('\n').trim();
        const encodedMessage = encodeURIComponent(cleanMessage);
        const whatsappUrl =`https://api.whatsapp.com/send/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        toast.success("Membuka WhatsApp untuk berbagi...");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-8 font-sans">
            <motion.div
                className="max-w-7xl mx-auto space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* --- Header (Sama) --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-15 gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#3b82f6] via-[#1c4381] to-[#011584] bg-clip-text text-transparent">
                            Dashboard Statistik P3K 2026
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                            Pantau pendaftaran dan partisipasi secara *real-time*.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={fetchData}
                            disabled={loading}
                            variant="outline"
                            className="flex items-center gap-2 px-5 py-3 rounded-full text-base bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            <span>{loading ? 'Memuat...' : 'Refresh'}</span>
                        </Button>
                        <Button
                            onClick={handleShareToWhatsApp}
                            disabled={loading}
                            variant="outline"
                            className="flex items-center gap-2 px-5 py-3 rounded-full text-base bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 border-green-500 shadow-sm hover:shadow-md transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                            <span>Share WA</span>
                        </Button>
                    </div>
                </div>

                {/* --- Kartu Statistik Utama (Sama, Tetap Global) --- */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {loading ? renderSkeletons(4) : (
                        <>
                            <StatCard
                                title="Total Pendapatan"
                                value={formattedTotalIncome}
                                icon={<DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
                                color="emerald"
                            />
                            <StatCard
                                title="Total Sekolah Mendaftar"
                                value={totalSchools}
                                icon={<Home className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                                color="indigo"
                            />
                            <StatCard
                                title="Total Tim Terdaftar"
                                value={globalTotalTim} // <-- Gunakan global
                                icon={<Users2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />}
                                color="sky"
                            />
                            <StatCard
                                title="Total Peserta"
                                value={globalTotalParticipants.toLocaleString('id-ID')} // <-- Gunakan global
                                icon={<Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />}
                                color="pink"
                            />
                        </>
                    )}
                </motion.div>

                {/* --- Area Filter (Baru) --- */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <Filter className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <label htmlFor="kategoriFilter" className="font-medium text-slate-700 dark:text-slate-300">
                        Tampilkan Statistik Untuk:
                    </label>
                    <select
                        id="kategoriFilter"
                        value={selectedKategori}
                        onChange={(e) => setSelectedKategori(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Semua">Semua Kategori</option>
                        <option value="Wira">Wira</option>
                        <option value="Madya">Madya</option>
                    </select>
                </div>


                {/* --- Grid Chart --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Peserta per Lomba (Menggunakan filteredData) */}
                    <div className="lg:col-span-2">
                        <ChartCard title={`Peserta per Mata Lomba (${selectedKategori})`} icon={<BarChart3 className="w-6 h-6 text-indigo-500" />}>
                            {loading ? <Skeleton className="h-full w-full rounded-xl bg-slate-200 dark:bg-slate-700" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pesertaPerLombaData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            interval={0}
                                            tick={{ fill: 'currentColor', className: 'text-xs text-slate-600 dark:text-slate-400' }}
                                            stroke="currentColor" className="text-slate-600 dark:text-slate-400"
                                            height={60} // Beri ruang lebih untuk label miring
                                        />
                                        <YAxis
                                            tick={{ fill: 'currentColor', className: 'text-xs text-slate-600 dark:text-slate-400' }}
                                            stroke="currentColor" className="text-slate-600 dark:text-slate-400"
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                                            contentStyle={{
                                                background: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(5px)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                                color: '#0f172a',
                                                padding: '10px 15px'
                                            }}
                                            labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                                            itemStyle={{ padding: '2px 0' }}
                                        />
                                        <Bar dataKey="value" name="Jumlah Peserta" radius={[8, 8, 0, 0]}>
                                            {pesertaPerLombaData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* Kategori Sekolah (Tetap Global) */}
                    <div>
                        <ChartCard title="Kategori Sekolah" icon={<PieIcon className="w-6 h-6 text-emerald-500" />}>
                           {loading ? <Skeleton className="h-full w-full rounded-xl bg-slate-200 dark:bg-slate-700" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={kategoriData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={110}
                                            innerRadius={70}
                                            paddingAngle={5}
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                                                const RADIAN = Math.PI / 180;
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                return (
                                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold text-lg">
                                                        {value}
                                                    </text>
                                                );
                                            }}
                                            labelLine={false}
                                        >
                                            {kategoriData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-white dark:stroke-slate-800" strokeWidth={3} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            iconType="circle"
                                            wrapperStyle={{ marginTop: '20px', color: 'currentColor' }}
                                            formatter={(value, entry) => (
                                                <span className="text-slate-600 dark:text-slate-300 ml-1">
                                                    {value} ({entry.payload?.value ?? 0})
                                                </span>
                                            )}
                                        />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>
                </div>

                {/* --- Grid Chart Baru (Tim per Lomba, Menggunakan filteredData) --- */}
                <div className="grid grid-cols-1 gap-6">
                    <ChartCard title={`Tim per Mata Lomba (${selectedKategori})`} icon={<Trophy className="w-6 h-6 text-sky-500" />}>
                        {loading ? <Skeleton className="h-full w-full rounded-xl bg-slate-200 dark:bg-slate-700" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timPerLombaData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: 'currentColor', className: 'text-xs text-slate-600 dark:text-slate-400' }}
                                        stroke="currentColor" className="text-slate-600 dark:text-slate-400"
                                        height={60} // Beri ruang lebih
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: 'currentColor', className: 'text-xs text-slate-600 dark:text-slate-400' }}
                                        stroke="currentColor" className="text-slate-600 dark:text-slate-400"
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                                        contentStyle={{
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            backdropFilter: 'blur(5px)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                            color: '#0f172a'
                                        }}
                                        labelStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="value" name="Jumlah Tim" radius={[8, 8, 0, 0]}>
                                        {timPerLombaData.map((entry, index) => (
                                            <Cell key={`cell-tim-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

            </motion.div>

            {/* --- Toast Container (Sama) --- */}
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar
                theme="colored"
                toastClassName="rounded-lg shadow-sm font-medium"
            />
        </div>
    );
}