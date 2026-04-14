'use client';

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import DetailModal from "./DetailModal";
import FormModal from "@/components/FormModal";
import { usePendaftar } from "@/hooks/usePendaftar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabase";
import {
  Pencil,
  Eye,
  Trash2,
  Plus,
  FileDown,
  RefreshCw,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  Link2,
  Users, // Icon untuk Peserta
  BarChart3, // Icon untuk Statistik
  Trophy, // Icon untuk Juara
  UploadCloud,
  Landmark, // Icon untuk Upload
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data, loading, refetch } = usePendaftar();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [formParticipant, setFormParticipant] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- (Fungsi handleExport, handleToggleStatus, handleDelete, handlePrint tetap SAMA) ---
    const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendaftar");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "pendaftar.xlsx");
  };


  const handleDelete = async (id: number) => {
    if(window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        const { error } = await supabase.from("pendaftaran").delete().eq("id", id);
        if (error) console.error("Gagal menghapus data:", error.message);
        else refetch();
    }
  };

 const handlePrint = () => {
    const originalTable = document.querySelector("table");
    if (!originalTable) return;

    const printTable = originalTable.cloneNode(true) as HTMLTableElement;
    
    // Dapatkan semua teks header
    const headers = Array.from(originalTable.querySelectorAll("th")).map(th => th.textContent);

    // Cari indeks kolom yang ingin dihapus
    const waHeaderIndex = headers.indexOf("WA");
    const totalHeaderIndex = headers.indexOf("Total");
    const actionHeaderIndex = headers.indexOf("Aksi");
    const buktiHeaderIndex = headers.indexOf("Bukti");
    const kwitansiHeaderIndex = headers.indexOf("Kwitansi");
    const kategoriHeaderIndex = headers.indexOf("Kategori");

    // Kumpulkan semua indeks yang valid (lebih besar dari -1)
    const indicesToRemove = [
        waHeaderIndex,
        totalHeaderIndex,
        actionHeaderIndex,
        buktiHeaderIndex,
        kwitansiHeaderIndex,
        kategoriHeaderIndex
    ].filter(index => index > -1);

    // Urutkan indeks secara menurun (dari terbesar ke terkecil)
    indicesToRemove.sort((a, b) => b - a);

    const removeColumn = (table: HTMLTableElement, index: number) => {
        // Hapus header
        table.querySelector("thead tr")?.children[index]?.remove();
        // Hapus sel di setiap baris body
        table.querySelectorAll("tbody tr").forEach(row => row.children[index]?.remove());
    };

    // Hapus kolom berdasarkan indeks yang sudah diurutkan
    indicesToRemove.forEach(index => {
        removeColumn(printTable, index);
    });

    const style = `
      <style>
        body { font-family: sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
        th { background-color: #f8f9fa; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        @media print {
          @page { size: landscape; margin: 10mm; }
          /* Sembunyikan elemen yang tidak ingin dicetak */
          .no-print { display: none; } 
        }
      </style>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write("<html><head><title>Data Pendaftar P3K 2026</title>");
      printWindow.document.write(style);
      printWindow.document.write("</head><body>");
      printWindow.document.write("<h2 style='text-align:center; margin-bottom:20px;'>Data Pendaftaran P3K 2026</h2>");
      printWindow.document.write(printTable.outerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };


  const filteredData = useMemo(() => {
    return (data || []).filter((item) => {
      const matchesSearchTerm =
        item.nama_sekolah?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pembina?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory
        ? item.kategori === selectedCategory
        : true;
      return matchesSearchTerm && matchesCategory;
    });
  }, [data, searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Data untuk Link Navigasi
   const navigationLinks = [
     { href: "/admin/keuangan", label: "Manajemen Keuangan", icon: <Landmark className="h-5 w-5" /> },
      { href: "/admin/participants", label: "Data Peserta", icon: <Users className="h-5 w-5" /> },
      { href: "/admin/daftar-ulang", label: "Daftar Ulang", icon: <Users className="h-5 w-5" /> },
      { href: "/admin/statistik", label: "Statistik Pendaftaran", icon: <BarChart3 className="h-5 w-5" /> },
      { href: "/admin/input-juara", label: "Input Daftar Juara", icon: <Trophy className="h-5 w-5" /> },
      { href: "/admin/hasil-upload", label: "Upload Form Penilaian", icon: <UploadCloud className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0F1419] to-[#1E293B] p-4 md:p-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              Database Pendaftaran
              <span className="ml-2 text-lg text-sky-400 md:text-xl">{filteredData.length} data</span>
            </h1>
          </div>
          <Button 
            variant="default"
            size="sm"
            onClick={() => { setFormParticipant(null); setFormOpen(true); }}
            className="gap-2 shadow-lg transition-all hover:scale-[1.02] bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
          >
            <Plus className="h-4 w-4" />
            Tambah Peserta
          </Button>
        </div>

        {/* Control Panel */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-lg md:p-6">
          {/* ... (Kode Control Panel Anda) ... */}
           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari sekolah atau pembina..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-100 bg-gray-50 p-3 pl-12 text-sm text-gray-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border-2 border-gray-100 bg-gray-50 p-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Semua Kategori</option>
                <option value="Madya">Madya</option>
                <option value="Wira">Wira</option>
              </select>
              
              <div className="flex gap-2">
                <TooltipProvider>
                  {[
                    { icon: <RefreshCw className="h-4 w-4"/>, action: refetch, label: 'Refresh' },
                    { icon: <FileDown className="h-4 w-4"/>, action: handleExport, label: 'Export Excel' },
                    { icon: <Printer className="h-4 w-4"/>, action: handlePrint, label: 'Print' },
                  ].map((btn, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          size="icon" 
                          onClick={btn.action}
                          className="h-10 w-10 p-0 transition-all hover:scale-105 border-gray-200"
                        >
                          {btn.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{btn.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
            // ... (Kode Skeleton) ...
             <div className="space-y-4 rounded-2xl bg-white p-6 shadow-lg">
                {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl bg-gray-100" />
                ))}
            </div>
        ) : filteredData.length === 0 ? (
            // ... (Kode Data tidak ditemukan) ...
             <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
                <div className="mx-auto max-w-md">
                <div className="animate-bounce">
                    <svg className="mx-auto h-24 w-24 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Data tidak ditemukan</h3>
                <p className="mt-2 text-sm text-gray-500">Coba gunakan kata kunci atau filter yang berbeda</p>
                </div>
            </div>
        ) : (
            // ... (Kode Tabel Anda) ...
             <div className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                        <tr>
                            {[
                            'Sekolah', 'WA', 'Kategori', 
                            'T. Putra', 'T. Putri', 'PP', 'Poco', 'MJ',
                            'Poster', 'PMR', 'Total', 'Bukti', 'Kwitansi',
                             'Aksi'
                            ].map((header, i) => (
                            <th key={i} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                {header}
                            </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {paginatedData.map((row) => (
                            <tr key={row.id} className="transition-colors hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate" title={row.nama_sekolah}>
                                    {row.nama_sekolah}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                    <a 
                                    href={`https://wa.me/+62${row.whatsapp.replace(/^0/, '')}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    >
                                    {row.whatsapp}
                                    </a>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    row.kategori === "Madya" 
                                        ? "bg-purple-100 text-purple-800" 
                                        : "bg-blue-100 text-blue-800"
                                    }`}>
                                    {row.kategori}
                                    </span>
                                </td>

                                {[
                                    row.tandu_putra, row.tandu_putri, row.pertolongan_pertama,
                                    row.senam_poco_poco, row.mojang_jajaka, row.poster, row.pmr_cerdas
                                ].map((val, idx) => (
                                    <td key={idx} className="whitespace-nowrap px-3 py-3 text-center text-sm text-gray-500">
                                    {val || 0}
                                    </td>
                                ))}

                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                    Rp{row.total?.toLocaleString("id-ID") || 0}
                                </td>

                                <td className="whitespace-nowrap px-2 py-3 text-center text-sm no-print">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <a 
                                                    href={row.bukti} 
                                                    className={`inline-flex items-center ${row.bukti ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 cursor-not-allowed'}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => !row.bukti && e.preventDefault()}
                                                >
                                                    <Link2 className="h-4 w-4" />
                                                </a>
                                            </TooltipTrigger>
                                            {row.bukti && <TooltipContent><p>Lihat Bukti</p></TooltipContent>}
                                        </Tooltip>
                                    </TooltipProvider>
                                </td>

                                <td className="whitespace-nowrap px-2 py-3 text-center text-sm no-print">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <a 
                                                    href={row.kwitansi_url} 
                                                    className={`inline-flex items-center ${row.kwitansi_url ? 'text-green-600 hover:text-green-800' : 'text-gray-300 cursor-not-allowed'}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => !row.kwitansi_url && e.preventDefault()}
                                                >
                                                    <Link2 className="h-4 w-4" />
                                                </a>
                                            </TooltipTrigger>
                                            {row.kwitansi_url && <TooltipContent><p>Lihat Kwitansi</p></TooltipContent>}
                                        </Tooltip>
                                    </TooltipProvider>
                                </td>
                                

                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                    <TooltipProvider>
                                        {[
                                        { icon: <Eye />, action: () => setSelectedParticipant(row), color: 'text-blue-600', label: 'Detail' },
                                        { icon: <Pencil />, action: () => { setFormParticipant(row); setFormOpen(true); }, color: 'text-green-600', label: 'Edit' },
                                        { icon: <Trash2 />, action: () => handleDelete(row.id), color: 'text-sky-600', label: 'Hapus' },
                                        ].map((btn, i) => (
                                        <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-8 w-8 p-0 hover:scale-110 ${btn.color}`}
                                                onClick={btn.action}
                                            >
                                                {btn.icon}
                                            </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                            <p>{btn.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        ))}
                                    </TooltipProvider>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
             <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 shadow-lg sm:flex-row">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> - 
                    <span className="font-semibold text-gray-900"> {Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of 
                    <span className="font-semibold text-gray-900"> {filteredData.length}</span> entries
                </div>
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="gap-1 rounded-lg"
                    >
                    <ChevronLeft className="h-4 w-4" />
                    </Button>
                     <span className="px-2 text-sm">
                        Page {currentPage} of {totalPages}
                     </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="gap-1 rounded-lg"
                    >
                    <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}

        {/* ======================================== */}
        {/* BAGIAN NAVIGASI YANG DIKEMBALIKAN */}
        {/* ======================================== */}
        <div className="mt-8 mb-6 border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Navigasi Cepat</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {navigationLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="group rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:scale-105 border border-gray-100 hover:border-blue-200"
                    >
                        <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                            {link.icon}
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{link.label}</h3>
                            <p className="text-xs text-gray-500">Buka Halaman</p>
                        </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
        {/* ======================================== */}
        {/* AKHIR BAGIAN NAVIGASI */}
        {/* ======================================== */}

      </div>

      {/* Modals and Toast */}
      <ToastContainer position="top-right" autoClose={3000} />
      {selectedParticipant && (
        <DetailModal data={selectedParticipant} open onClose={() => setSelectedParticipant(null)} />
      )}
      {formOpen && (
        <FormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setFormParticipant(null); }}
          data={formParticipant}
          onSuccess={() => {
            refetch();
            setFormOpen(false);
            setFormParticipant(null);
          }}
        />
      )}
    </div>
  );
}