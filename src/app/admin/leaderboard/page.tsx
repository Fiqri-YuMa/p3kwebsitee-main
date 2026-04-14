"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
    RefreshCw, 
    Search, 
    ChevronDown, 
    Trophy, 
    School, 
    Users, 
    Award, 
    
    Medal,
    ServerCrash 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';

// --- Interface Juara & SchoolRanking (Tetap Sama) ---
interface Juara {
  mata_lomba: string;
  nama_sekolah: string;
  juara_ke: string;
  kategori: string;
  // Tambahkan id jika ada dan unik, atau pastikan kombinasi field unik untuk key
  id?: string; // Opsional, jika ada
}

interface SchoolRanking {
  nama_sekolah: string;
  total_juara_1: number;
  total_juara_2: number;
  total_juara_3: number;
  kategori: string;
}

// --- Konstanta JUARA_ORDER & fungsi normalizeSchoolName (Tetap Sama) ---
const JUARA_ORDER = ["Juara 1", "Juara 2", "Juara 3", "Harapan 1", "Harapan 2"];

const normalizeSchoolName = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/SMK\s?NEGERI\s?/gi, "SMKN ") // Lebih spesifik untuk SMKN
    .replace(/SMA\s?NEGERI\s?/gi, "SMAN ") // Untuk SMAN
    .replace(/\s+/g, " ")
    .trim();
};

// Varian Animasi (Tetap Sama)
const containerVariants = { /* ... */ };
const itemVariants = { /* ... */ };
// (Kode StatCard, RankingCard, CompetitionAccordion, LoadingSkeleton tidak berubah, saya akan singkat untuk respons ini)
// Anggap komponen StatCard, RankingCard, CompetitionAccordion, LoadingSkeleton sudah ada seperti sebelumnya

// --- StatCard ---
const StatCard = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) => (
  <motion.div 
    className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg flex items-center gap-4 transition-all hover:border-sky-400/30 hover:shadow-sky-500/5 hover:scale-105"
    variants={itemVariants}
  >
    <div className="w-12 h-12 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400">
        <Icon className="w-6 h-6" />
    </div>
    <div>
        <div className="text-sm text-sky-300/80">{label}</div>
        <div className="text-3xl font-bold text-white mt-1">{value}</div>
    </div>
  </motion.div>
);

// --- RankingCard ---
const RankingCard = ({ school, rank }: { school: SchoolRanking; rank: number }) => {
    const rankColors: { [key: number]: string } = {
        1: 'border-sky-400 bg-sky-900/20 shadow-sky-500/10',
        2: 'border-gray-400 bg-gray-700/20 shadow-gray-500/10',
        3: 'border-sky-600 bg-sky-900/20 shadow-sky-600/10',
    };
    const rankIconColors: { [key: number]: string } = {
        1: 'text-sky-400',
        2: 'text-gray-400',
        3: 'text-sky-600',
    };
    const isTop3 = rank <= 3;
    return (
        <motion.div 
            className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-sky-400/30 transition-all shadow-md hover:shadow-xl ${rankColors[rank] || 'hover:bg-white/10'}`}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isTop3 ? rankIconColors[rank] : 'text-white bg-white/10'}`}>
                        {isTop3 ? <Medal className="w-6 h-6" /> : rank}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate" title={school.nama_sekolah}>
                            {school.nama_sekolah}
                        </h3>
                         <p className="text-xs text-gray-400">{school.kategori}</p>
                    </div>
                </div>
                <div className="flex gap-3 md:gap-5 text-center">
                    <div>
                        <div className="text-lg font-bold text-sky-400">{school.total_juara_1}</div>
                        <div className="text-xs text-sky-300/70">🥇</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-300">{school.total_juara_2}</div>
                        <div className="text-xs text-gray-400/70">🥈</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-sky-400">{school.total_juara_3}</div>
                        <div className="text-xs text-sky-500/70">🥉</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- CompetitionAccordion ---
const CompetitionAccordion = ({ title, results, category }: { 
  title: string; 
  results: Juara[]; 
  category: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div 
        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
        variants={itemVariants}
        layout 
    >
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors focus:outline-none text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base truncate">{title}</h3>
          <p className="text-xs text-sky-300/80 mt-1">{category}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-sky-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {JUARA_ORDER.map((juaraKe) => {
                        const peserta = results.find((j) => j.juara_ke === juaraKe);
                        return (
                            <div
                                key={juaraKe}
                                className="p-3 text-sm bg-black/20 rounded-lg border border-white/10 flex items-center gap-3"
                            >
                                <Trophy className="w-4 h-4 text-sky-300 flex-shrink-0" />

                                <div>
                                    <div className="font-medium text-sky-300 truncate">{juaraKe}</div>
                                    <div className="text-white truncate text-xs" title={peserta?.nama_sekolah}>
                                        {peserta?.nama_sekolah || "-"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- LoadingSkeleton ---
const LoadingSkeleton = () => (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
        <Skeleton className="h-12 w-3/4 bg-white/10 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 bg-white/10 rounded-2xl" />
            <Skeleton className="h-24 bg-white/10 rounded-2xl" />
        </div>
        <Skeleton className="h-10 w-1/3 bg-white/10 rounded-lg" />
        <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 bg-white/10 rounded-2xl" />
            ))}
        </div>
         <Skeleton className="h-10 w-1/3 bg-white/10 rounded-lg" />
         <Skeleton className="h-12 w-full bg-white/10 rounded-xl" />
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 bg-white/10 rounded-2xl" />
            ))}
        </div>
    </div>
);


const Leaderboard = () => {
  const [data, setData] = useState<Juara[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Wira");
  const kategoriList = ["Wira", "Madya"];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchJuara = async () => {
    setLoading(true);
    try {
      const { data: juaraData, error } = await supabase.from("juara").select("*");
      if (error) throw error;
      setData(juaraData || []);
      setError(null);
    } catch {
      setError('Gagal memuat data. Silakan coba lagi.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJuara();
  }, []);

  const { schoolRanking } = useMemo(() => {
      const schools: Record<string, SchoolRanking> = {};
      data
        .filter(j => j.kategori === activeCategory) // Filter berdasarkan kategori aktif untuk peringkat sekolah
        .forEach(j => {
            const normalized = normalizeSchoolName(j.nama_sekolah);
            if (!schools[normalized]) {
                schools[normalized] = {
                    nama_sekolah: normalized, // Simpan nama yang sudah dinormalisasi
                    total_juara_1: 0,
                    total_juara_2: 0,
                    total_juara_3: 0,
                    kategori: activeCategory, // Simpan kategori aktif
                };
            }
            if (j.juara_ke === "Juara 1") schools[normalized].total_juara_1++;
            if (j.juara_ke === "Juara 2") schools[normalized].total_juara_2++;
            if (j.juara_ke === "Juara 3") schools[normalized].total_juara_3++;
        });

      const ranking = Object.values(schools).sort((a, b) => {
          if (a.total_juara_1 !== b.total_juara_1) return b.total_juara_1 - a.total_juara_1;
          if (a.total_juara_2 !== b.total_juara_2) return b.total_juara_2 - a.total_juara_2;
          return b.total_juara_3 - a.total_juara_3;
      });
      return { schoolRanking: ranking };
  }, [data, activeCategory]);

  // --- PERUBAHAN: Mengelompokkan berdasarkan mata_lomba DAN kategori ---
  const groupedMataLombaByCategory = useMemo(() => {
    const result: Record<string, Juara[]> = {}; // Key: "mata_lomba-kategori"
    data.forEach(j => {
        const key = `${j.mata_lomba}-${j.kategori}`; // Kunci unik per lomba per kategori
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(j);
    });
    // Urutkan hasil di dalam setiap grup berdasarkan JUARA_ORDER
    for (const key in result) {
        result[key].sort((a, b) => JUARA_ORDER.indexOf(a.juara_ke) - JUARA_ORDER.indexOf(b.juara_ke));
    }
    return result;
  }, [data]);
  // --- AKHIR PERUBAHAN ---

  // --- PERUBAHAN: Filter untuk grup yang baru ---
  const filteredGroupedMataLomba = useMemo(() => {
    const lowerQuery = debouncedQuery.toLowerCase();
    return Object.entries(groupedMataLombaByCategory).filter(
      ([groupKey, results]) => {
        // Asumsi nama mata lomba tidak mengandung '-' yang dipakai sebagai pemisah
        // Jika bisa mengandung '-', gunakan pemisah yang lebih unik atau parse dengan hati-hati
        const parts = groupKey.split('-');
        const categoryName = parts.pop() || ''; // Ambil bagian terakhir sebagai kategori
        const mataLombaName = parts.join('-'); // Sisanya adalah nama mata lomba

        return (
            mataLombaName.toLowerCase().includes(lowerQuery) ||
            categoryName.toLowerCase().includes(lowerQuery) ||
            results.some(r => normalizeSchoolName(r.nama_sekolah).toLowerCase().includes(normalizeSchoolName(lowerQuery))) // Normalisasi juga query sekolah
        );
      }
    );
  }, [groupedMataLombaByCategory, debouncedQuery]);
  // --- AKHIR PERUBAHAN ---

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0F1419] to-[#1E293B] py-16 sm:py-24 px-4 md:px-8 text-white">
      <div className="absolute inset-0 -z-10 opacity-20">
        {/* Placeholder untuk efek bintang/partikel */}
      </div>
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.header /* ... sama ... */ >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-400/10 rounded-full border-2 border-sky-400/30">
                    <Trophy className="h-8 w-8 text-sky-400" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-400 to-cyan-500">
                        Leaderboard P3K
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Hasil Perolehan Juara Sementara</p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                    href="/admin/hasil-akhir"
                    className="flex-1 sm:flex-none flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all shadow-lg border border-white/10"
                >
                    <School className="w-4 h-4" />
                    <span className="truncate">Lihat Format Nilai Peserta</span>
                </Link>
                <motion.button
                    onClick={fetchJuara}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    title="Refresh Data"
                >
                    <RefreshCw className="w-5 h-5 text-sky-400" />
                </motion.button>
            </div>
        </motion.header>

        {error && ( /* ... sama ... */ 
             <motion.div 
                className="p-4 text-center text-sky-400 bg-sky-900/30 rounded-lg border border-sky-500/50 flex items-center justify-center gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
                <ServerCrash className="w-5 h-5"/> {error}
            </motion.div>
        )}

        <motion.div /* ... StatCard (sama) ... */ 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={containerVariants} initial="hidden" animate="visible"
        >
            <StatCard label="Total Penghargaan Diraih" value={data.length} icon={Award} />
            <StatCard label="Sekolah Berpartisipasi (Total)" value={new Set(data.map(d => normalizeSchoolName(d.nama_sekolah))).size} icon={Users} />
        </motion.div>

        <section className="bg-black/20 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-sky-400">🏆 Peringkat Sekolah 🏆</h2>
          <div className="flex justify-center mb-6 bg-white/5 p-1.5 rounded-full border border-white/10">
            {kategoriList.map((kategori) => (
              <button
                key={kategori}
                onClick={() => setActiveCategory(kategori)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === kategori 
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-black shadow-lg' 
                  : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {kategori}
              </button>
            ))}
          </div>
            <motion.div 
                className="space-y-3"
                key={activeCategory} // Key untuk re-animasi saat kategori berubah
                variants={containerVariants} initial="hidden" animate="visible"
            >
            {schoolRanking.length > 0 ? schoolRanking.map((school, i) => (
                <RankingCard key={`${school.nama_sekolah}-${school.kategori}-${i}`} school={school} rank={i + 1} />
            )) : (
                <div className="text-center py-6 text-gray-400">Belum ada data juara untuk kategori {activeCategory}.</div>
            )}
            </motion.div>
        </section>

        <section className="bg-black/20 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-sky-400">📋 Hasil Per Mata Lomba 📋</h2>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400/70" />
            <input
              type="text"
              placeholder="Cari mata lomba, kategori, atau sekolah..." // Placeholder diupdate
              className="w-full pl-12 pr-4 py-3 text-sm rounded-xl border-2 border-white/20 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <motion.div 
            className="space-y-3"
            variants={containerVariants} initial="hidden" animate="visible"
          >
          {/* --- PERUBAHAN: Menggunakan filteredGroupedMataLomba --- */}
          {filteredGroupedMataLomba.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
                Tidak ada mata lomba yang cocok untuk &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            filteredGroupedMataLomba.map(([groupKey, juaraList]) => {
                // juaraList di sini sudah berisi Juara[] untuk kombinasi mata_lomba & kategori
                const firstJuara = juaraList[0]; 
                if (!firstJuara) return null; // Seharusnya tidak terjadi jika juaraList tidak kosong

                return (
                    <CompetitionAccordion
                        key={groupKey} // groupKey sudah unik: "mata_lomba-kategori"
                        title={firstJuara.mata_lomba}
                        results={juaraList} // juaraList sudah diurutkan di useMemo
                        category={firstJuara.kategori}
                    />
                );
            })
          )}
          {/* --- AKHIR PERUBAHAN --- */}
          </motion.div>
        </section>
        
        <footer className="text-center text-xs text-gray-600 border-t border-white/10 pt-4">
          Papan Skor P3K 2026 - KSR PMI Unit Universitas Suryakancana
        </footer>
      </div>
    </div>
  );
};

export default Leaderboard;