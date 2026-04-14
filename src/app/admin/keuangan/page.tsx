'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Tambahkan useCallback
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  PlusCircle,
  Trash2,
  Loader2,
  Search,
  BookMarked,
  FileDown,
  Paperclip,
  Link as LinkIcon, // Ikon baru untuk grup tombol ekspor
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// Untuk DropdownMenu jika Anda memilih pendekatan itu
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

interface Transaction {
  id: number;
  created_at: string;
  tanggal: string;
  keterangan: string;
  jenis: 'Masuk' | 'Keluar';
  jumlah: number;
  kategori?: string;
  bukti_url?: string | null;
}

const initialFormState = {
  tanggal: format(new Date(), 'yyyy-MM-dd'),
  keterangan: '',
  jenis: 'Masuk' as 'Masuk' | 'Keluar',
  jumlah: '',
  kategori: '',
};

const BUCKET_NAME = 'bukti-keuangan';

export default function HalamanKeuangan() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = useCallback(async () => { // Gunakan useCallback
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('keuangan')
      .select('*')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      setError('Gagal memuat data keuangan.');
      setTransactions([]);
    } else {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, []); // Dependensi kosong karena tidak ada state/prop dari luar

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]); // Sekarang fetchTransactions stabil

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'jumlah' ? value.replace(/\D/g, '') : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, tanggal: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setError(null); // Bersihkan error jika ada file baru
      const file = e.target.files[0];
      // Validasi ukuran file (misal, maks 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran file bukti maksimal 2MB.");
        setProofFile(null);
        if (document.getElementById('bukti_file')) {
           (document.getElementById('bukti_file') as HTMLInputElement).value = '';
        }
        return;
      }
      // Validasi tipe file (contoh: hanya gambar dan pdf)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError("Tipe file bukti hanya boleh JPG, PNG, GIF, atau PDF.");
        setProofFile(null);
        if (document.getElementById('bukti_file')) {
           (document.getElementById('bukti_file') as HTMLInputElement).value = '';
        }
        return;
      }
      setProofFile(file);
    } else {
      setProofFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (fungsi handleSubmit tidak berubah) ...
    e.preventDefault();
    setError(null);

    if (!formData.tanggal || !formData.keterangan || !formData.jumlah || !formData.jenis) {
      setError('Tanggal, Keterangan, Jumlah, dan Jenis wajib diisi.');
      return;
    }
    if (isNaN(Number(formData.jumlah)) || Number(formData.jumlah) <= 0) {
        setError('Jumlah harus berupa angka positif yang valid.');
        return;
    }

    setSubmitting(true);
    let buktiUrlToSave: string | null = null;

    if (proofFile) {
      const fileExt = proofFile.name.split('.').pop()?.toLowerCase();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const fileName = `public/transaksi/${Date.now()}_${randomSuffix}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, proofFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setError(`Gagal mengupload bukti: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
      if (!urlData?.publicUrl) {
          setError('Gagal mendapatkan URL bukti setelah upload.');
          setSubmitting(false);
          return;
      }
      buktiUrlToSave = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('keuangan').insert([{
        tanggal: formData.tanggal,
        keterangan: formData.keterangan,
        jenis: formData.jenis,
        jumlah: Number(formData.jumlah),
        kategori: formData.kategori || null,
        bukti_url: buktiUrlToSave,
    }]);

    if (insertError) {
      setError(`Gagal menyimpan transaksi: ${insertError.message}`);
    } else {
      setFormData(initialFormState);
      setProofFile(null);
      if (document.getElementById('bukti_file')) {
        (document.getElementById('bukti_file') as HTMLInputElement).value = '';
      }
      await fetchTransactions();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number, buktiUrl?: string | null) => {
    // ... (fungsi handleDelete tidak berubah) ...
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    setSubmitting(true); // Bisa menggunakan state loading yang lebih spesifik jika perlu

    const { error: deleteRecordError } = await supabase.from('keuangan').delete().eq('id', id);
    if (deleteRecordError) {
      setError('Gagal menghapus data transaksi.');
      setSubmitting(false);
      return;
    }

    if (buktiUrl) {
        try {
            const urlObject = new URL(buktiUrl);
            const pathParts = urlObject.pathname.split(`/${BUCKET_NAME}/`);
            if (pathParts.length > 1) {
                const filePath = pathParts[1];
                const { error: deleteFileError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
                if (deleteFileError) {
                    // Non-blocking error, data record sudah terhapus
                    console.warn(`Data transaksi terhapus, tetapi gagal menghapus file bukti dari storage: ${deleteFileError.message}`);
                    alert(`Data transaksi terhapus, tetapi gagal menghapus file bukti dari storage. Harap hapus manual jika perlu.`);
                }
            }
        } catch (e) { console.error("Error processing bukti_url for deletion:", e); }
    }
    await fetchTransactions();
    setSubmitting(false);
  };

  const summary = useMemo(() => {
    // ... (summary tidak berubah) ...
    const totalMasuk = transactions.filter((t) => t.jenis === 'Masuk').reduce((acc, t) => acc + t.jumlah, 0);
    const totalKeluar = transactions.filter((t) => t.jenis === 'Keluar').reduce((acc, t) => acc + t.jumlah, 0);
    return { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    // ... (filteredTransactions tidak berubah) ...
    return transactions.filter(t =>
      t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);


  // --- Fungsi Ekspor Excel yang Dimodifikasi ---
  const handleExport = (jenisEkspor: 'Semua' | 'Masuk' | 'Keluar') => {
    let dataToFilter = filteredTransactions; // Mulai dengan data yang sudah terfilter di UI
    let fileNameSuffix = "Semua";

    if (jenisEkspor === 'Masuk') {
      dataToFilter = dataToFilter.filter(t => t.jenis === 'Masuk');
      fileNameSuffix = "Pemasukan";
    } else if (jenisEkspor === 'Keluar') {
      dataToFilter = dataToFilter.filter(t => t.jenis === 'Keluar');
      fileNameSuffix = "Pengeluaran";
    }

    if (dataToFilter.length === 0) {
      alert(`Tidak ada data ${jenisEkspor.toLowerCase()} untuk diekspor.`);
      return;
    }

    const dataToExport = dataToFilter.map(t => ({
      'Tanggal': format(parseISO(t.tanggal), 'dd-MM-yyyy'),
      'Keterangan': t.keterangan,
      'Kategori': t.kategori || '-',
      'Jenis': t.jenis,
      'Jumlah (Rp)': t.jumlah,
      'Link Bukti': t.bukti_url || '-'
    }));

    // Hanya tambahkan ringkasan jika mengekspor "Semua"
    if (jenisEkspor === 'Semua') {
      dataToExport.push(
        { 'Tanggal': '', 'Keterangan': '', 'Kategori': '', 'Jenis': '' as any, 'Jumlah (Rp)': '' as any, 'Link Bukti': '' }, // Baris kosong
        { 'Tanggal': 'TOTAL PEMASUKAN', 'Keterangan': '', 'Kategori': '', 'Jenis': 'Masuk' as any, 'Jumlah (Rp)': summary.totalMasuk, 'Link Bukti': '' },
        { 'Tanggal': 'TOTAL PENGELUARAN', 'Keterangan': '', 'Kategori': '', 'Jenis': 'Keluar' as any, 'Jumlah (Rp)': summary.totalKeluar, 'Link Bukti': '' },
        { 'Tanggal': 'SALDO AKHIR', 'Keterangan': '', 'Kategori': '', 'Jenis': '' as any, 'Jumlah (Rp)': summary.saldo, 'Link Bukti': '' }
      );
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Laporan Keuangan ${fileNameSuffix}`);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, `laporan_keuangan_${fileNameSuffix.toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
        {/* ... (Header dan Summary Cards tidak berubah) ... */}
        <div className="mb-6 md:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <BookMarked className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
            Manajemen Keuangan
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Keuangan P3K 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="shadow-lg border-l-4 border-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                    <ArrowUpCircle className="h-5 w-5 text-green-500"/>
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{formatRupiah(summary.totalMasuk)}</div>
                </CardContent>
            </Card>
            <Card className="shadow-lg border-l-4 border-sky-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                    <ArrowDownCircle className="h-5 w-5 text-sky-500"/>
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-sky-600">{formatRupiah(summary.totalKeluar)}</div>
                </CardContent>
            </Card>
            <Card className="shadow-lg border-l-4 border-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
                    <Banknote className="h-5 w-5 text-blue-500"/>
                </CardHeader>
                <CardContent>
                    <div className={`text-xl sm:text-2xl font-bold ${summary.saldo >= 0 ? 'text-blue-600' : 'text-sky-600'}`}>
                        {formatRupiah(summary.saldo)}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* ... (Form Tambah Transaksi tidak berubah) ... */}
        <Card className="shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-gray-700" /> Tambah Transaksi Baru
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="p-4 sm:p-6 space-y-4 md:space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error!</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tanggal">Tanggal Transaksi</Label>
                    <Input type="date" id="tanggal" name="tanggal" value={formData.tanggal} onChange={handleDateInputChange} required className="mt-1 w-full" />
                  </div>
                  <div>
                    <Label htmlFor="keterangan">Keterangan</Label>
                    <Input id="keterangan" name="keterangan" value={formData.keterangan} onChange={handleChange} placeholder="Contoh: Pembelian ATK Lomba" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="kategori">Kategori (Opsional)</Label>
                    <Input id="kategori" name="kategori" value={formData.kategori} onChange={handleChange} placeholder="Contoh: Konsumsi, Transportasi" className="mt-1" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                    <Input id="jumlah" name="jumlah" type="text" pattern="[0-9]*" value={formData.jumlah} onChange={handleChange} placeholder="Contoh: 50000" required className="mt-1" />
                  </div>
                  <div>
                      <Label htmlFor="jenis">Jenis Transaksi</Label>
                      <Select value={formData.jenis} onValueChange={(value) => handleSelectChange('jenis', value as 'Masuk' | 'Keluar')} required >
                        <SelectTrigger id="jenis" className="mt-1"><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masuk">Uang Masuk</SelectItem>
                          <SelectItem value="Keluar">Uang Keluar</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  <div>
                    <Label htmlFor="bukti_file">
                        <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-gray-600"/> Bukti Transaksi (Opsional)
                        </div>
                    </Label>
                    <Input id="bukti_file" name="bukti_file" type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFileChange}
                      className="mt-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    {proofFile && <p className="text-xs text-gray-500 mt-1">File: {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)</p>}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-4 sm:p-6">
              <Button type="submit" disabled={submitting || loading} className="w-full sm:w-auto">
                {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>) : ('Simpan Transaksi')}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg sm:text-xl">Daftar Transaksi</CardTitle>
              {/* --- Tombol Ekspor Baru --- */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => handleExport('Semua')} disabled={filteredTransactions.length === 0 || loading} className="text-xs sm:text-sm">
                    <FileDown className="h-3.5 w-3.5 mr-1.5" />
                    Excel (Semua)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('Masuk')} disabled={transactions.filter(t=>t.jenis === 'Masuk').length === 0 || loading} className="text-xs sm:text-sm text-green-600 border-green-500 hover:bg-green-50 hover:text-green-700">
                    <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                    Excel (Masuk)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('Keluar')} disabled={transactions.filter(t=>t.jenis === 'Keluar').length === 0 || loading} className="text-xs sm:text-sm text-sky-600 border-sky-500 hover:bg-sky-50 hover:text-sky-700">
                    <ArrowDownCircle className="h-3.5 w-3.5 mr-1.5" />
                    Excel (Keluar)
                </Button>
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Cari keterangan atau kategori..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            {/* ... (Tabel tidak berubah) ... */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3 py-3 sm:px-4">Tgl</TableHead>
                    <TableHead className="px-3 py-3 sm:px-4">Keterangan</TableHead>
                    <TableHead className="px-3 py-3 sm:px-4 hidden md:table-cell">Kategori</TableHead>
                    <TableHead className="text-right px-3 py-3 sm:px-4">Masuk</TableHead>
                    <TableHead className="text-right px-3 py-3 sm:px-4">Keluar</TableHead>
                    <TableHead className="px-3 py-3 sm:px-4 hidden sm:table-cell">Bukti</TableHead>
                    <TableHead className="text-center px-3 py-3 sm:px-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-500" />
                        <p className="mt-2 text-gray-500">Memuat...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                        Tidak ada transaksi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id} className="text-xs sm:text-sm">
                        <TableCell className="px-3 py-3 sm:px-4 whitespace-nowrap">{format(parseISO(t.tanggal), 'dd/MM/yy', { locale: id })}</TableCell>
                        <TableCell className="font-medium max-w-[150px] sm:max-w-xs truncate px-3 sm:px-4" title={t.keterangan}>{t.keterangan}</TableCell>
                        <TableCell className="px-3 py-3 sm:px-4 hidden md:table-cell"><Badge variant="secondary" className="text-xs">{t.kategori || '-'}</Badge></TableCell>
                        <TableCell className="text-right px-3 sm:px-4 text-green-600 whitespace-nowrap">
                          {t.jenis === 'Masuk' ? formatRupiah(t.jumlah) : '-'}
                        </TableCell>
                        <TableCell className="text-right px-3 sm:px-4 text-sky-600 whitespace-nowrap">
                          {t.jenis === 'Keluar' ? formatRupiah(t.jumlah) : '-'}
                        </TableCell>
                        <TableCell className="px-3 py-3 sm:px-4 hidden sm:table-cell">
                          {t.bukti_url ? (
                            <a href={t.bukti_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs sm:text-sm flex items-center gap-1 whitespace-nowrap">
                              <LinkIcon className="h-3.5 w-3.5"/> Lihat
                            </a>
                          ) : ( <span className="text-xs text-gray-400">-</span> )}
                        </TableCell>
                        <TableCell className="text-center px-3 py-3 sm:px-4">
                          <Button variant="ghost" size="icon" className="text-sky-500 hover:text-sky-700 hover:bg-sky-100 rounded-full w-7 h-7 sm:w-8 sm:h-8" onClick={() => handleDelete(t.id, t.bukti_url)} disabled={submitting} >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}