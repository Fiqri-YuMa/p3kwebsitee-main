'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback, JSX } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  Search,
  FileDown,
  Pencil,
  X,
  Save,
  ArrowUpDown,
  Users,
  ServerCrash,
  ListOrdered,
  PlusCircle,
  School,
  User,
  Swords,
  Check,
  ChevronsUpDown,
  Trash2, // Icon untuk Hapus
  AlertTriangle, // Icon untuk modal konfirmasi
} from 'lucide-react';
import { LOMBA_LIST } from '@/data/lomba';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
// Jika Anda ingin menggunakan komponen AlertDialog shadcn/ui

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in environment variables.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipe Data (sama seperti sebelumnya)
type PendaftaranOption = {
  id: string;
  nama_sekolah: string;
};

type Participant = {
  id: string;
  pendaftaran_id: string;
  nama_sekolah: string;
  data_peserta: string;
  lomba: string;
  created_at?: string | null;
};

type NewSingleParticipantData = {
  pendaftaran_id: string;
  nama_sekolah: string;
  data_peserta: string;
  lomba: string;
};

type SortConfig = {
  key: keyof Participant;
  direction: 'ascending' | 'descending';
} | null;

const initialNewSingleParticipantData: NewSingleParticipantData = {
  pendaftaran_id: '',
  nama_sekolah: '',
  data_peserta: '',
  lomba: '',
};

const ITEMS_PER_PAGE = 10;

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // State untuk Modal Tambah Tunggal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSingleParticipantForm, setNewSingleParticipantForm] = useState<NewSingleParticipantData>(initialNewSingleParticipantData);
  const [selectedPendaftaranForSingle, setSelectedPendaftaranForSingle] = useState<PendaftaranOption | null>(null);
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  const [isSekolahComboboxOpen, setIsSekolahComboboxOpen] = useState(false);

  // State untuk Modal Tambah Banyak Peserta
  const [isAddMultipleModalOpen, setIsAddMultipleModalOpen] = useState(false);
  const [selectedPendaftaranForMultiple, setSelectedPendaftaranForMultiple] = useState<PendaftaranOption | null>(null);
  const [lombaPesertaInputs, setLombaPesertaInputs] = useState<Record<string, string[]>>({});
  const [activeLombasForMultiple, setActiveLombasForMultiple] = useState<Set<string>>(new Set());
  const [isMultipleSekolahComboboxOpen, setIsMultipleSekolahComboboxOpen] = useState(false);
  const [isAddingMultiple, setIsAddingMultiple] = useState(false);

  // State untuk Modal Hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Callbacks untuk Fetch Data ---
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('peserta')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false });
    if (fetchError) {
      console.error('Fetch error:', fetchError.message);
      setError('Gagal memuat data peserta. Silakan coba lagi.');
    } else {
      setParticipants(data || []);
    }
    setLoading(false);
  }, []);

  const fetchPendaftaranList = useCallback(async () => {
    const { data, error } = await supabase
      .from('pendaftaran')
      .select('id, nama_sekolah');
    if (error) {
      console.error('Error fetching pendaftaran list:', error);
      setPendaftaranList([]);
    } else if (data) {
      const validPendaftaranData = data.filter(item => item.id && item.nama_sekolah) as PendaftaranOption[];
      setPendaftaranList(validPendaftaranData.sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah)));
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
    fetchPendaftaranList();
  }, [fetchParticipants, fetchPendaftaranList]);

  // --- UseEffect untuk Fokus dan Escape Key ---
  useEffect(() => {
    if (isEditModalOpen && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditModalOpen]);

  const closeEditModal = useCallback(() => {setIsEditModalOpen(false); setEditingParticipant(null); setNewName('');}, []);
  const closeAddModal = useCallback(() => {setIsAddModalOpen(false); setNewSingleParticipantForm(initialNewSingleParticipantData); setSelectedPendaftaranForSingle(null); setIsSekolahComboboxOpen(false);}, []);
  const closeAddMultipleModal = useCallback(() => {setIsAddMultipleModalOpen(false); setSelectedPendaftaranForMultiple(null); setActiveLombasForMultiple(new Set()); setLombaPesertaInputs({}); setIsMultipleSekolahComboboxOpen(false);}, []);
  const closeDeleteModal = useCallback(() => {setIsDeleteModalOpen(false); setParticipantToDelete(null);}, []);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditModalOpen) closeEditModal();
        if (isAddModalOpen) closeAddModal();
        if (isAddMultipleModalOpen) closeAddMultipleModal();
        if (isDeleteModalOpen) closeDeleteModal(); // Tambahkan ini
      }
    };
    if (isEditModalOpen || isAddModalOpen || isAddMultipleModalOpen || isDeleteModalOpen) { // Tambahkan ini
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditModalOpen, isAddModalOpen, isAddMultipleModalOpen, isDeleteModalOpen, closeEditModal, closeAddModal, closeAddMultipleModal, closeDeleteModal]);

  // --- Logic untuk Sorting dan Filtering ---
  const sortedAndFilteredParticipants = useMemo(() => {
    // ... (logika sorting dan filtering tidak berubah) ...
    let dataToProcess = [...participants];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      dataToProcess = dataToProcess.filter(
        (p) =>
          (p.nama_sekolah || '').toLowerCase().includes(q) ||
          (p.data_peserta || '').toLowerCase().includes(q) ||
          (p.lomba || '').toLowerCase().includes(q)
      );
    }
    if (sortConfig !== null) {
      const dataToSort = [...dataToProcess];
      dataToSort.sort((a, b) => {
        const key = sortConfig.key;
        const valA = a[key];
        const valB = b[key];
        if (valA == null && valB == null) return 0;
        if (valA == null) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (valB == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (typeof valA === 'string' && typeof valB === 'string') {
          const lowerA = valA.toLowerCase();
          const lowerB = valB.toLowerCase();
          if (lowerA < lowerB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (lowerA > lowerB) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else {
          if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
      return dataToSort;
    }
    return dataToProcess;
  }, [searchQuery, participants, sortConfig]);

  // --- Logic untuk Pagination ---
  const totalPages = useMemo(() => { /* ... (tidak berubah) ... */ if (sortedAndFilteredParticipants.length === 0) return 1; return Math.ceil(sortedAndFilteredParticipants.length / ITEMS_PER_PAGE);}, [sortedAndFilteredParticipants.length]);
  const paginatedParticipants = useMemo(() => { /* ... (tidak berubah) ... */ const indexOfLastItem = currentPage * ITEMS_PER_PAGE; const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE; return sortedAndFilteredParticipants.slice(indexOfFirstItem, indexOfLastItem);}, [sortedAndFilteredParticipants, currentPage]);
  useEffect(() => { /* ... (reset halaman saat filter/sort tidak berubah) ... */ setCurrentPage(1);}, [searchQuery, sortConfig]);
  useEffect(() => { /* ... (penyesuaian currentPage jika tidak valid tidak berubah) ... */ if (currentPage > totalPages && totalPages > 0) {setCurrentPage(totalPages);} else if (currentPage < 1 && totalPages > 0) {setCurrentPage(1);} else if (totalPages === 1 && currentPage !== 1) {setCurrentPage(1);}}, [totalPages, currentPage]);
  const handlePageChange = (page: number) => { /* ... (tidak berubah) ... */ const targetPage = Math.max(1, Math.min(page, totalPages > 0 ? totalPages : 1)); if (currentPage !== targetPage) {setCurrentPage(targetPage); window.scrollTo({ top: 200, behavior: 'smooth' });}};
  const requestSort = (key: keyof Participant) => { /* ... (tidak berubah) ... */ if (!['nama_sekolah', 'data_peserta', 'lomba', 'created_at'].includes(key as string)) return; let direction: 'ascending' | 'descending' = 'ascending'; if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {direction = 'descending';} setSortConfig({ key, direction });};

  // --- CRUD Operations ---
  const openEditModal = (participant: Participant) => { /* ... (tidak berubah) ... */ setEditingParticipant(participant); setNewName(participant.data_peserta); setIsEditModalOpen(true);};
  const handleSaveEdit = async () => { /* ... (tidak berubah) ... */ if (!editingParticipant || !newName.trim() || isSaving) return; setIsSaving(true); const { error: updateError } = await supabase.from('peserta').update({ data_peserta: newName.trim() }).eq('id', editingParticipant.id); if (updateError) {console.error('Update error:', updateError.message); alert('Gagal memperbarui nama peserta. ' + updateError.message);} else {await fetchParticipants(); closeEditModal(); alert('Nama peserta berhasil diperbarui.');} setIsSaving(false);};
  const openAddModal = () => { /* ... (tidak berubah) ... */ setNewSingleParticipantForm(initialNewSingleParticipantData); setSelectedPendaftaranForSingle(null); setIsAddModalOpen(true);};
  const handleNewSingleParticipantFormChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... (tidak berubah) ... */ const { name, value } = e.target; setNewSingleParticipantForm(prev => ({ ...prev, [name]: value }));};
  const handleNewSingleParticipantLombaSelectChange = (value: string) => { /* ... (tidak berubah) ... */ setNewSingleParticipantForm(prev => ({ ...prev, lomba: value }));};
  const handleAddSingleParticipant = async () => { /* ... (tidak berubah) ... */ if (!selectedPendaftaranForSingle || !newSingleParticipantForm.data_peserta.trim() || !newSingleParticipantForm.lomba.trim()) {alert('Semua field (Nama Sekolah, Nama Peserta, Lomba) harus diisi.'); return;} if (isAddingSingle) return; setIsAddingSingle(true); const payload = {pendaftaran_id: selectedPendaftaranForSingle.id, nama_sekolah: selectedPendaftaranForSingle.nama_sekolah, data_peserta: newSingleParticipantForm.data_peserta.trim(), lomba: newSingleParticipantForm.lomba.trim(),}; const { error: insertError } = await supabase.from('peserta').insert(payload); if (insertError) {console.error('Insert error:', insertError.message); alert('Gagal menambahkan peserta baru. ' + insertError.message);} else {await fetchParticipants(); closeAddModal(); alert('Peserta baru berhasil ditambahkan.');} setIsAddingSingle(false);};
  const openAddMultipleModal = () => { /* ... (tidak berubah) ... */ setSelectedPendaftaranForMultiple(null); setActiveLombasForMultiple(new Set()); setLombaPesertaInputs({}); setIsAddMultipleModalOpen(true);};
  const handleLombaSelectionChange = (lombaNama: string, isSelected: boolean) => { /* ... (tidak berubah) ... */ const newActiveLombas = new Set(activeLombasForMultiple); const newLombaPesertaInputs = { ...lombaPesertaInputs }; if (isSelected) {newActiveLombas.add(lombaNama); if (!newLombaPesertaInputs[lombaNama] || newLombaPesertaInputs[lombaNama].length === 0) {newLombaPesertaInputs[lombaNama] = [''];}} else {newActiveLombas.delete(lombaNama); delete newLombaPesertaInputs[lombaNama];} setActiveLombasForMultiple(newActiveLombas); setLombaPesertaInputs(newLombaPesertaInputs);};
  const handlePesertaNameChangeForMultiple = (lombaNama: string, index: number, value: string) => { /* ... (tidak berubah) ... */ const newLombaPesertaInputs = { ...lombaPesertaInputs }; if (newLombaPesertaInputs[lombaNama]) {newLombaPesertaInputs[lombaNama][index] = value; setLombaPesertaInputs(newLombaPesertaInputs);}};
  const addPesertaFieldForMultiple = (lombaNama: string) => { /* ... (tidak berubah) ... */ const newLombaPesertaInputs = { ...lombaPesertaInputs }; if (newLombaPesertaInputs[lombaNama]) {newLombaPesertaInputs[lombaNama].push('');} else {newLombaPesertaInputs[lombaNama] = [''];} setLombaPesertaInputs(newLombaPesertaInputs);};
  const removePesertaFieldForMultiple = (lombaNama: string, index: number) => { /* ... (tidak berubah) ... */ const newLombaPesertaInputs = { ...lombaPesertaInputs }; if (newLombaPesertaInputs[lombaNama]) {if (newLombaPesertaInputs[lombaNama].length > 1) {newLombaPesertaInputs[lombaNama].splice(index, 1);} else if (newLombaPesertaInputs[lombaNama].length === 1) {newLombaPesertaInputs[lombaNama][index] = '';} setLombaPesertaInputs(newLombaPesertaInputs);}};
  const handleAddMultipleParticipants = async () => { /* ... (tidak berubah) ... */ if (!selectedPendaftaranForMultiple) {alert('Nama sekolah harus dipilih.'); return;} if (activeLombasForMultiple.size === 0) {alert('Minimal pilih satu mata lomba.'); return;} const participantsToInsert: Omit<Participant, 'id' | 'created_at'>[] = []; let hasValidParticipant = false; activeLombasForMultiple.forEach(lombaNama => {const pesertaNames = lombaPesertaInputs[lombaNama] || []; pesertaNames.forEach(nama => {if (nama.trim()) {participantsToInsert.push({pendaftaran_id: selectedPendaftaranForMultiple.id, nama_sekolah: selectedPendaftaranForMultiple.nama_sekolah, lomba: lombaNama, data_peserta: nama.trim(),}); hasValidParticipant = true;}});}); if (!hasValidParticipant) {alert('Minimal isi satu nama peserta di salah satu lomba yang dipilih.'); return;} if (isAddingMultiple) return; setIsAddingMultiple(true); const { error: insertError } = await supabase.from('peserta').insert(participantsToInsert); if (insertError) {console.error('Insert multiple error:', insertError.message); alert('Gagal menambahkan peserta. Detail: ' + insertError.message);} else {await fetchParticipants(); closeAddMultipleModal(); alert(`${participantsToInsert.length} peserta berhasil ditambahkan.`);} setIsAddingMultiple(false);};
  
  // Fungsi untuk Hapus Peserta
  const openDeleteModal = (participant: Participant) => {
    setParticipantToDelete(participant);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!participantToDelete || isDeleting) return;
    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from('peserta')
      .delete()
      .eq('id', participantToDelete.id);

    if (deleteError) {
      console.error('Delete error:', deleteError.message);
      alert('Gagal menghapus peserta. ' + deleteError.message);
    } else {
      await fetchParticipants(); // Re-fetch data
      // Atau update state lokal:
      // setParticipants(prev => prev.filter(p => p.id !== participantToDelete.id));
      alert(`Peserta "${participantToDelete.data_peserta}" berhasil dihapus.`);
    }
    setIsDeleting(false);
    closeDeleteModal();
  };


  const handleExport = () => { /* ... (tidak berubah) ... */ if (sortedAndFilteredParticipants.length === 0) {alert("Tidak ada data untuk diekspor."); return;} const formattedData = sortedAndFilteredParticipants.map((participant, index) => ({'No.': index + 1, 'Nama Sekolah': participant.nama_sekolah, 'Nama Peserta': participant.data_peserta, 'Lomba': participant.lomba,})); const ws = XLSX.utils.json_to_sheet(formattedData); ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 30 }, { wch: 25 }]; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Peserta'); XLSX.writeFile(wb, `daftar_peserta_p3k_${new Date().toISOString().slice(0,10)}.xlsx`);};
  const getSortIcon = (key: keyof Participant) => { /* ... (tidak berubah) ... */ if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 text-gray-400" />; return <ArrowUpDown className="h-3 w-3 text-white" />;};

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <motion.div /* ... */ >
        {/* ... (Header, Kontrol Search & Tombol - tidak berubah signifikan) ... */}
        <div className="flex items-center justify-center mb-8 gap-3">
          <Users className="h-8 w-8 text-sky-600" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white text-center">
            Daftar Peserta P3K
          </h1>
        </div>

        <div className="mb-6 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text" placeholder="Cari data..."
              className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Pencarian peserta"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105 gap-2 w-full sm:w-auto"
            >
              <PlusCircle className="h-4 w-4" /> Tambah Peserta
            </Button>
            <Button
              onClick={openAddMultipleModal}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all hover:scale-105 gap-2 w-full sm:w-auto"
            >
              <Users className="h-4 w-4" /> Tambah Banyak Peserta
            </Button>
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-all hover:scale-105 gap-2 w-full sm:w-auto"
              disabled={sortedAndFilteredParticipants.length === 0 || loading}
            >
              <FileDown className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        </div>

        <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white">
                {/* ... (Header tabel tidak berubah) ... */}
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-16">
                    <div className="flex items-center gap-1"> <ListOrdered size={14} /> No. </div>
                  </th><th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:opacity-80 transition-opacity" onClick={() => requestSort('nama_sekolah')}>
                      Nama Sekolah {getSortIcon('nama_sekolah')}
                    </button>
                  </th><th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:opacity-80 transition-opacity" onClick={() => requestSort('data_peserta')}>
                      Nama Peserta {getSortIcon('data_peserta')}
                    </button>
                  </th><th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:opacity-80 transition-opacity" onClick={() => requestSort('lomba')}>
                      Lomba {getSortIcon('lomba')}
                    </button>
                  </th><th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-40"> Aksi </th> {/* Lebarkan kolom Aksi */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  // ... (Skeleton tidak berubah) ...
                  [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-4 py-4"><Skeleton className="h-6 w-8 rounded bg-gray-200 dark:bg-gray-700" /></td><td className="px-6 py-4"><Skeleton className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" /></td><td className="px-6 py-4"><Skeleton className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" /></td><td className="px-6 py-4"><Skeleton className="h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700" /></td><td className="px-6 py-4 text-center"><div className="flex justify-center gap-2"><Skeleton className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-700" /><Skeleton className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-700" /></div></td>
                    </tr>
                  ))
                ) : error ? (
                  // ... (Error state tidak berubah) ...
                  <tr><td colSpan={5} className="text-center py-10 text-sky-500"><ServerCrash className="h-10 w-10 mx-auto mb-2" /> {error}</td></tr>
                ) : paginatedParticipants.length === 0 ? (
                  // ... (No data state tidak berubah) ...
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400"><Search className="h-10 w-10 mx-auto mb-2 text-gray-300" /> Tidak ada data peserta yang cocok.</td></tr>
                ) : (
                  paginatedParticipants.map((p, index) => (
                    <motion.tr key={p.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: index * 0.03 }}>
                      {/* ... (Data row tidak berubah) ... */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300"> {(currentPage - 1) * ITEMS_PER_PAGE + index + 1} </td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"> {p.nama_sekolah} </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"> {p.data_peserta} </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"> {p.lomba} </td><td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-2">
                            <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition gap-1" onClick={() => openEditModal(p)}>
                                <Pencil className="h-3 w-3" /> Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-sky-500 text-sky-500 hover:bg-sky-600 hover:text-white transition gap-1 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-500"
                                onClick={() => openDeleteModal(p)}
                            >
                                <Trash2 className="h-3 w-3" /> Hapus
                            </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ... (Pagination tidak berubah) ... */}
        {!loading && sortedAndFilteredParticipants.length > 0 && (
            <div className="mt-8 flex justify-center">
            <Pagination>
                <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={cn("cursor-pointer select-none", currentPage === 1 && "pointer-events-none opacity-50")}
                    aria-disabled={currentPage === 1}
                    />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNum => {
                        if (totalPages <= 7) return true;
                        if (pageNum === 1 || pageNum === totalPages) return true;
                        if (pageNum >= currentPage - 2 && pageNum <= currentPage + 2) return true;
                        return false;
                    })
                    .reduce((acc, pageNum, index, arr) => {
                        acc.push(
                            <PaginationItem key={pageNum}>
                            <PaginationLink
                                onClick={(e) => { e.preventDefault(); handlePageChange(pageNum); }}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer select-none"
                            >
                                {pageNum}
                            </PaginationLink>
                            </PaginationItem>
                        );
                        if (arr[index + 1] && arr[index + 1] > pageNum + 1) {
                            acc.push(<PaginationItem key={`ellipsis-after-${pageNum}`}><PaginationEllipsis className="select-none"/></PaginationItem>);
                        }
                        return acc;
                    }, [] as JSX.Element[])
                }
                <PaginationItem>
                    <PaginationNext
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={cn("cursor-pointer select-none", currentPage === totalPages && "pointer-events-none opacity-50")}
                    aria-disabled={currentPage === totalPages}
                    />
                </PaginationItem>
                </PaginationContent>
            </Pagination>
            </div>
        )}
      </motion.div>

      {/* ... (Modal Edit Peserta - tidak berubah) ... */}
      {/* ... (Modal Tambah Peserta Tunggal - tidak berubah) ... */}
      {/* ... (Modal Tambah Banyak Peserta - tidak berubah) ... */}

        {/* Modal Edit Peserta */}
      <AnimatePresence>{isEditModalOpen && (<>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={closeEditModal} />
        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8" role="dialog" aria-modal="true">
          <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Pencil className="h-5 w-5 text-blue-600" /> Edit Nama Peserta</h2>
            <button onClick={closeEditModal} aria-label="Tutup" className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-500 transition rounded-full p-1 hover:bg-sky-100 dark:hover:bg-gray-700"><X className="h-6 w-6" /></button>
          </div>
          <div className="mb-4"><Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"> Nama Sekolah </Label><p className="text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-700 p-3 rounded-md">{editingParticipant?.nama_sekolah}</p></div>
          <div className="mb-4"><Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"> Lomba </Label><p className="text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-700 p-3 rounded-md">{editingParticipant?.lomba}</p></div>
          <div className="mb-6"><Label htmlFor="editName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Peserta Baru</Label><Input id="editName" ref={editInputRef} type="text" className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Masukkan nama peserta baru" /></div>
          <div className="flex justify-end gap-3 border-t pt-4 dark:border-gray-700">
            <Button variant="outline" onClick={closeEditModal} disabled={isSaving}> Batal </Button>
            <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white shadow-md gap-2" disabled={!newName.trim() || isSaving}>
              {isSaving ? (<Save className="h-4 w-4 animate-spin" />) : (<Save className="h-4 w-4" />)} {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </motion.div>
      </>)}</AnimatePresence>

      {/* Modal Tambah Peserta Tunggal */}
      <AnimatePresence>{isAddModalOpen && (<>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={closeAddModal} />
        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8" role="dialog" aria-modal="true">
          <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"><PlusCircle className="h-5 w-5 text-blue-600" /> Tambah Peserta</h2>
            <button onClick={closeAddModal} aria-label="Tutup" className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-500 transition rounded-full p-1 hover:bg-sky-100 dark:hover:bg-gray-700"><X className="h-6 w-6" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="addSingleNamaSekolahCombobox" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <School size={14} /> Nama Sekolah <span className="text-sky-500">*</span>
              </Label>
              <Popover open={isSekolahComboboxOpen} onOpenChange={setIsSekolahComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="addSingleNamaSekolahCombobox" variant="outline" role="combobox" aria-expanded={isSekolahComboboxOpen}
                    className="w-full justify-between dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:dark:bg-gray-600"
                  >
                    {selectedPendaftaranForSingle
                      ? selectedPendaftaranForSingle.nama_sekolah
                      : "Pilih atau cari sekolah..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0 dark:bg-gray-800 border-gray-700">
                  <Command className="dark:bg-gray-800 rounded-md">
                    <CommandInput placeholder="Cari sekolah..." className="h-9 dark:text-white focus:ring-0 focus:border-transparent ring-offset-0" />
                    <CommandList><CommandEmpty className="dark:text-gray-400 p-2 text-sm">Sekolah tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {pendaftaranList.map((pendaftaran) => (
                          <CommandItem key={pendaftaran.id} value={pendaftaran.nama_sekolah}
                            onSelect={() => {
                                setSelectedPendaftaranForSingle(pendaftaran);
                                setIsSekolahComboboxOpen(false);
                            }}
                            className="dark:text-gray-200 dark:hover:bg-gray-700 aria-selected:dark:bg-gray-600 cursor-pointer"
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedPendaftaranForSingle?.id === pendaftaran.id ? "opacity-100" : "opacity-0")} />
                            {pendaftaran.nama_sekolah}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="addSingleDataPeserta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <User size={14} /> Nama Peserta <span className="text-sky-500">*</span>
              </Label>
              <Input
                id="addSingleDataPeserta" name="data_peserta" type="text"
                className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={newSingleParticipantForm.data_peserta} onChange={handleNewSingleParticipantFormChange}
                placeholder="Masukkan nama peserta"
              />
            </div>
            <div>
              <Label htmlFor="addSingleLomba" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Swords size={14} /> Mata Lomba <span className="text-sky-500">*</span>
              </Label>
              <Select value={newSingleParticipantForm.lomba} onValueChange={handleNewSingleParticipantLombaSelectChange}>
                <SelectTrigger id="addSingleLomba" className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Pilih Mata Lomba" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {LOMBA_LIST.map(lomba => (
                    <SelectItem key={lomba.id} value={lomba.nama} className="dark:hover:bg-gray-600 aria-selected:dark:bg-gray-500 cursor-pointer">
                      {lomba.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t pt-6 mt-6 dark:border-gray-700">
            <Button variant="outline" onClick={closeAddModal} disabled={isAddingSingle}> Batal </Button>
            <Button
              onClick={handleAddSingleParticipant}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2"
              disabled={isAddingSingle || !selectedPendaftaranForSingle || !newSingleParticipantForm.data_peserta.trim() || !newSingleParticipantForm.lomba.trim()}
            >
              {isAddingSingle ? (<Save className="h-4 w-4 animate-spin" />) : (<PlusCircle className="h-4 w-4" />)}
              {isAddingSingle ? 'Menambahkan...' : 'Tambah Peserta'}
            </Button>
          </div>
        </motion.div>
      </>)}</AnimatePresence>

      {/* Modal Tambah Banyak Peserta Baru */}
      <AnimatePresence>{isAddMultipleModalOpen && (<>
        {/* ... (kode modal tambah banyak tidak berubah dari sebelumnya) ... */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={closeAddMultipleModal} />
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Users className="h-5 w-5 text-teal-600" /> Tambah Banyak Peserta</h2>
            <button onClick={closeAddMultipleModal} aria-label="Tutup" className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-500 transition rounded-full p-1 hover:bg-sky-100 dark:hover:bg-gray-700"><X className="h-6 w-6" /></button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto flex-grow">
            <div>
              <Label htmlFor="addMultipleNamaSekolahCombobox" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <School size={14} /> Nama Sekolah <span className="text-sky-500">*</span>
              </Label>
              <Popover open={isMultipleSekolahComboboxOpen} onOpenChange={setIsMultipleSekolahComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="addMultipleNamaSekolahCombobox" variant="outline" role="combobox" aria-expanded={isMultipleSekolahComboboxOpen}
                    className="w-full justify-between dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:dark:bg-gray-600"
                  >
                    {selectedPendaftaranForMultiple
                      ? selectedPendaftaranForMultiple.nama_sekolah
                      : "Pilih atau cari sekolah..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0 dark:bg-gray-800 border-gray-700">
                  <Command className="dark:bg-gray-800 rounded-md">
                    <CommandInput placeholder="Cari sekolah..." className="h-9 dark:text-white focus:ring-0 focus:border-transparent ring-offset-0" />
                    <CommandList><CommandEmpty className="dark:text-gray-400 p-2 text-sm">Sekolah tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {pendaftaranList.map((pendaftaran) => (
                          <CommandItem key={pendaftaran.id} value={pendaftaran.nama_sekolah}
                            onSelect={() => {
                              setSelectedPendaftaranForMultiple(pendaftaran);
                              setIsMultipleSekolahComboboxOpen(false);
                            }}
                            className="dark:text-gray-200 dark:hover:bg-gray-700 aria-selected:dark:bg-gray-600 cursor-pointer"
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedPendaftaranForMultiple?.id === pendaftaran.id ? "opacity-100" : "opacity-0")} />
                            {pendaftaran.nama_sekolah}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Mata Lomba & Input Nama Peserta <span className="text-sky-500">*</span>
              </Label>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 border rounded-md p-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                {LOMBA_LIST.map((lomba) => (
                  <div key={lomba.id} className="py-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`lomba-multiple-${lomba.id}`}
                        checked={activeLombasForMultiple.has(lomba.nama)}
                        onCheckedChange={(checked) => handleLombaSelectionChange(lomba.nama, !!checked)}
                        className="dark:border-gray-600 data-[state=checked]:dark:bg-teal-600 data-[state=checked]:dark:text-white"
                      />
                      <Label htmlFor={`lomba-multiple-${lomba.id}`} className="font-medium text-sm cursor-pointer dark:text-gray-200">
                        {lomba.nama}
                      </Label>
                    </div>
                    {activeLombasForMultiple.has(lomba.nama) && (
                      <div className="pl-7 space-y-2 border-l-2 dark:border-gray-600 ml-2 pt-1 pb-2">
                        {(lombaPesertaInputs[lomba.nama] || ['']).map((namaPeserta, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="text"
                              placeholder={`Nama Peserta ${index + 1}`}
                              value={namaPeserta}
                              onChange={(e) => handlePesertaNameChangeForMultiple(lomba.nama, index, e.target.value)}
                              className="flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white h-9 text-sm"
                            />
                            <Button
                              type="button" variant="ghost" size="icon"
                              onClick={() => removePesertaFieldForMultiple(lomba.nama, index)}
                              className="text-sky-500 hover:text-sky-700 hover:bg-sky-100 dark:hover:bg-gray-700 h-9 w-9"
                               disabled={index === 0 && (lombaPesertaInputs[lomba.nama] || []).length === 1}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button" variant="outline" size="sm"
                          onClick={() => addPesertaFieldForMultiple(lomba.nama)}
                          className="mt-1 text-xs gap-1 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                        >
                          <PlusCircle className="h-3 w-3" /> Tambah Nama
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700 sticky top-10 bg-white dark:bg-gray-800 z-10">
            <Button variant="outline" onClick={closeAddMultipleModal} disabled={isAddingMultiple}> Batal </Button>
            <Button
              onClick={handleAddMultipleParticipants}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-md gap-2"
              disabled={isAddingMultiple || !selectedPendaftaranForMultiple || activeLombasForMultiple.size === 0}
            >
              {isAddingMultiple ? (<Save className="h-4 w-4 animate-spin" />) : (<Users className="h-4 w-4" />)}
              {isAddingMultiple ? 'Menambahkan...' : 'Simpan Semua Peserta'}
            </Button>
          </div>
        </motion.div>
      </>)}</AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>{isDeleteModalOpen && participantToDelete && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={closeDeleteModal} />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8"
            role="dialog" aria-modal="true"
          >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-sky-500" /> Konfirmasi Hapus
                </h2>
                <button onClick={closeDeleteModal} aria-label="Tutup" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-full p-1">
                <X className="h-6 w-6" />
                </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Anda yakin ingin menghapus peserta berikut?
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md mb-6 text-sm">
                <p><strong>Nama:</strong> {participantToDelete.data_peserta}</p>
                <p><strong>Sekolah:</strong> {participantToDelete.nama_sekolah}</p>
                <p><strong>Lomba:</strong> {participantToDelete.lomba}</p>
            </div>
            <p className="text-xs text-sky-600 dark:text-sky-400 mb-6">
                Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
                Batal
                </Button>
                <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                >
                {isDeleting ? (<Save className="h-4 w-4 animate-spin mr-2" />) : (<Trash2 className="h-4 w-4 mr-2" />)}
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
            </div>
          </motion.div>
        </>)}</AnimatePresence>
    </div>
  );
}