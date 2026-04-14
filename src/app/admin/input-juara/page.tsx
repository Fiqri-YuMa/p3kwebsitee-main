"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Award, School } from "lucide-react";

const kategoriOptions = ["Wira", "Madya"];
const mataLombaOptions = [
  "Tandu Putra",
  "Tandu Putri",
  "Pertolongan Pertama",
  "Senam Kreasi Poco-Poco",
  "Mojang Jajaka",
  "PMR Cerdas",
  "Poster",
];

export default function InputJuara() {
  const [kategori, setKategori] = useState("");
  const [mataLomba, setMataLomba] = useState("");
  const [juaraData, setJuaraData] = useState(
    [
      "Juara 1",
      "Juara 2",
      "Juara 3",
      "Harapan 1",
      "Harapan 2",
    ].map((juaraKe) => ({ namaSekolah: "", juaraKe }))
  );

  const handleChange = (index: number, value: string) => {
    const updated = [...juaraData];
    updated[index].namaSekolah = value;
    setJuaraData(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori || !mataLomba) {
      alert("Harap pilih kategori dan mata lomba.");
      return;
    }

    const payload = juaraData
      .filter((item) => item.namaSekolah)
      .map((item) => ({
        kategori,
        mata_lomba: mataLomba,
        nama_sekolah: item.namaSekolah,
        juara_ke: item.juaraKe,
      }));

    const { error } = await supabase.from("juara").insert(payload);
    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      alert("Data juara berhasil disimpan!");
      setKategori("");
      setMataLomba("");
      setJuaraData(
        juaraData.map((item) => ({ ...item, namaSekolah: "" }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0F1419] to-[#1E293B] py-20 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-sky-400/10 px-4 py-1 rounded-full border border-sky-400/20 mb-4">
            <Trophy className="h-5 w-5 text-sky-400" />
            <span className="text-sm text-sky-300">P3K 2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-400 to-cyan-500 bg-clip-text text-transparent mb-2">
            Input Data Juara
          </h1>
          <p className="text-gray-300 text-sm">Masukkan hasil penilaian peserta</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sky-300">Kategori</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-sky-400">
                  <School className="w-5 h-5" />
                </div>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/5 text-gray-200"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {kategoriOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-sky-300">Mata Lomba</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-sky-400">
                  <Award className="w-5 h-5" />
                </div>
                <select
                  value={mataLomba}
                  onChange={(e) => setMataLomba(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/5 text-gray-200"
                  required
                >
                  <option value="">Pilih Mata Lomba</option>
                  {mataLombaOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Input Sekolah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {juaraData.map((item, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-sky-300">
                  {item.juaraKe}
                </label>
                <input
                  type="text"
                  value={item.namaSekolah}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder="Nama Sekolah"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/5 text-gray-200 placeholder-gray-400"
                />
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-700 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Simpan Data</span>
          </button>
        </form>
      </div>
    </div>
  );
}