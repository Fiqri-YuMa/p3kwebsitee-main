'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import { Filter, ListOrdered, Save, Printer, Search, RefreshCw, Users } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';

// --- Tipe Data ---
interface Pendaftaran {
  id: string;
  kategori: string;
  nama_sekolah: string;
  tandu_putra: number;
  tandu_putri: number;
  pertolongan_pertama: number;
  senam_poco_poco: number;
  mojang_jajaka: number;
  poster: number;
  pmr_cerdas: number;
  created_at: string;
}

interface DaftarUlangEntry {
  pendaftaran_id: string;
  lomba_key: string;
  tim_ke: number;
  nomor_urut: number | null;
}

interface TransformedData {
  id: string; // unik untuk setiap baris di tabel UI: `${sekolah.id}-${lombaKey}-${tim_ke}`
  pendaftaran_id: string;
  nama_sekolah: string;
  kategori: string;
  lomba_key: string;
  lomba_name: string;
  tim_ke: number;
  nomor_urut: number | null;
  isDirty?: boolean;
}

// --- Nama Lomba ---
const lombaNames: Record<string, string> = {
  tandu_putra: 'Tandu Putra',
  tandu_putri: 'Tandu Putri',
  pertolongan_pertama: 'Pertolongan Pertama',
  senam_poco_poco: 'Senam Poco-Poco',
  mojang_jajaka: 'Mojang Jajaka',
  poster: 'Poster',
  pmr_cerdas: 'PMR Cerdas',
};
const lombaKeys = Object.keys(lombaNames);

// --- Komponen Utama ---
export default function DaftarUlangPage() {
  const [pendaftaranData, setPendaftaranData] = useState<Pendaftaran[]>([]);
  const [daftarUlangData, setDaftarUlangData] = useState<DaftarUlangEntry[]>([]);
  const [transformedData, setTransformedData] = useState<TransformedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterLomba, setFilterLomba] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    try {
      const pendaftarPromise = supabase.from('pendaftaran').select('*').order('nama_sekolah', { ascending: true });
      const ulangPromise = supabase.from('daftar_ulang').select('*');
      const [{ data: pendaftar, error: pendaftarError }, { data: ulang, error: ulangError }] = await Promise.all([pendaftarPromise, ulangPromise]);
      if (pendaftarError) throw pendaftarError;
      if (ulangError) throw ulangError;
      setPendaftaranData(pendaftar as Pendaftaran[] || []);
      setDaftarUlangData(ulang as DaftarUlangEntry[] || []);
      if (isRefresh) toast.success("Data berhasil diperbarui!");
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (loading && pendaftaranData.length === 0 && daftarUlangData.length === 0) {
        return;
    }
    setTransformedData(prevTransformedData => {
      const newDataMap = new Map<string, TransformedData>();
      pendaftaranData.forEach(sekolah => {
        lombaKeys.forEach(lombaKey => {
          const jumlahTim = sekolah[lombaKey as keyof Pendaftaran] as number;
          if (jumlahTim > 0) {
            for (let i = 1; i <= jumlahTim; i++) {
              const id = `${sekolah.id}-${lombaKey}-${i}`;
              const existingEntry = daftarUlangData.find(du => du.pendaftaran_id === sekolah.id && du.lomba_key === lombaKey && du.tim_ke === i);
              const previousItemState = prevTransformedData.find(t => t.id === id);

              newDataMap.set(id, {
                id: id,
                pendaftaran_id: sekolah.id,
                nama_sekolah: sekolah.nama_sekolah,
                kategori: sekolah.kategori,
                lomba_key: lombaKey,
                lomba_name: lombaNames[lombaKey],
                tim_ke: i,
                nomor_urut: existingEntry ? existingEntry.nomor_urut : null,
                isDirty: previousItemState ? previousItemState.isDirty : false,
              });
            }
          }
        });
      });
      return Array.from(newDataMap.values());
    });
  }, [pendaftaranData, daftarUlangData, loading]);

  // --- Fungsi Handle Input Nomor Urut (DIMODIFIKASI) ---
  const handleNomorUrutChange = (id: string, value: string) => {
    const newNomorUrut = value === '' || isNaN(parseInt(value)) ? null : parseInt(value);
    const itemBeingEdited = transformedData.find(item => item.id === id);

    if (!itemBeingEdited) return;

    if (newNomorUrut !== null) {
      // --- MODIFIKASI LOGIKA isDuplicate ---
      const isDuplicate = transformedData.some(otherItem =>
        otherItem.id !== itemBeingEdited.id && // Jangan bandingkan dengan item itu sendiri
        otherItem.lomba_key === itemBeingEdited.lomba_key &&
        otherItem.kategori === itemBeingEdited.kategori && // TAMBAHKAN PENGECEKAN KATEGORI
        otherItem.nomor_urut === newNomorUrut
      );
      // --- AKHIR MODIFIKASI ---

      if (isDuplicate) {
        toast.error(`Nomor urut ${newNomorUrut} sudah digunakan untuk lomba ${itemBeingEdited.lomba_name} pada kategori ${itemBeingEdited.kategori}.`);
        return;
      }
    }

    setTransformedData(prevData =>
      prevData.map(item => {
        if (item.id === id) {
          const isNowDirty = (item.nomor_urut !== newNomorUrut) || 
                             (item.nomor_urut === null && newNomorUrut !== null) ||
                             (item.nomor_urut !== null && newNomorUrut === null);
          return { ...item, nomor_urut: newNomorUrut, isDirty: item.isDirty || isNowDirty };
        }
        return item;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const itemsToSave = transformedData.filter(item => item.isDirty);
    if (itemsToSave.length === 0) { toast.info("Tidak ada perubahan untuk disimpan."); setSaving(false); return; }
    
    const dataToUpsert = itemsToSave.map(item => ({
      pendaftaran_id: item.pendaftaran_id,
      lomba_key: item.lomba_key,
      tim_ke: item.tim_ke,
      nomor_urut: item.nomor_urut,
    }));

    try {
      const { error } = await supabase.from('daftar_ulang').upsert(dataToUpsert, {
        onConflict: 'pendaftaran_id, lomba_key, tim_ke',
      });
      if (error) throw error;
      toast.success("Nomor urut berhasil disimpan!");
      await fetchData(false);
    } catch (error: any) {
      console.error("Error saving data:", JSON.stringify(error, null, 2));
      toast.error(`Gagal menyimpan: ${error?.message || 'Periksa RLS/Koneksi.'}`);
    } finally { setSaving(false); }
  };

  const filteredData = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return transformedData.filter(item =>
        (filterKategori === 'Semua' || item.kategori === filterKategori) &&
        (filterLomba === 'Semua' || item.lomba_key === filterLomba) &&
        (item.nama_sekolah || '').toLowerCase().includes(lowerCaseSearchTerm)
      )
      .sort((a, b) =>
        (a.nomor_urut ?? Number.MAX_SAFE_INTEGER) - (b.nomor_urut ?? Number.MAX_SAFE_INTEGER) ||
        (a.nama_sekolah || '').localeCompare(b.nama_sekolah || '') ||
        (a.lomba_name || '').localeCompare(b.lomba_name || '') ||
        a.tim_ke - b.tim_ke
      );
  }, [transformedData, filterKategori, filterLomba, searchTerm]);

  const handlePrint = () => {
    const tableId = "daftar-ulang-table";
    const originalTable = document.getElementById(tableId) as HTMLTableElement;
    if (!originalTable) {
        toast.error("Tabel tidak ditemukan untuk dicetak.");
        return;
    }
    const printTable = originalTable.cloneNode(true) as HTMLTableElement;
    printTable.querySelectorAll("tbody tr").forEach(row => {
        const tableRow = row as HTMLTableRowElement;
        if (tableRow.cells && tableRow.cells.length > 0) {
            const inputCell = tableRow.cells[tableRow.cells.length - 1] as HTMLTableCellElement; // Kolom terakhir
            if (inputCell) {
                const input = inputCell.querySelector("input[type='number']") as HTMLInputElement;
                if (input) {
                    inputCell.textContent = input.value || '-';
                    inputCell.style.textAlign = "center";
                } else {
                    const spanText = inputCell.querySelector(".print-only-text") as HTMLSpanElement;
                    if(spanText) inputCell.textContent = spanText.textContent || '-';
                }
            }
        }
    });
    
    printTable.querySelectorAll(".no-print-in-cloned").forEach(el => el.remove());

    const KategoriName = filterKategori === 'Semua' ? 'Semua Kategori' : filterKategori;
    const LombaName = filterLomba === 'Semua' ? 'Semua Lomba' : lombaNames[filterLomba] || 'Tidak Diketahui';

    const style = `
      <style>
        body { font-family: 'Arial', sans-serif; padding: 15px; }
        h2, h3 { text-align: center; margin: 5px 0; color: #333; }
        h2 { font-size: 16pt; }
        h3 { font-size: 12pt; font-weight: normal; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #555; padding: 7px; text-align: left; font-size: 9pt; word-break: break-word; }
        th { background-color: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        td:first-child, td:nth-child(3), td:nth-child(5), td:last-child { text-align: center; }
        @media print {
          @page { size: landscape; margin: 15mm; }
          body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write("<html><head><title>Daftar Ulang P3K</title>");
        printWindow.document.write(style);
        printWindow.document.write("</head><body>");
        printWindow.document.write("<h2>DAFTAR ULANG PESERTA P3K</h2>");
        printWindow.document.write(`<h3>Kategori: ${KategoriName} | Mata Lomba: ${LombaName}</h3>`);
        printWindow.document.write(printTable.outerHTML);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            try { printWindow.print(); } 
            catch (e) { 
                console.error("Gagal mencetak:", e); 
                toast.warn("Window cetak mungkin perlu ditutup manual.");
            }
        }, 500);
    } else {
        toast.error("Gagal membuka window baru untuk mencetak. Pastikan pop-up tidak diblokir.");
    }
  };

  const renderTableSkeleton = () => (
    Array(10).fill(0).map((_, i) => (
      <TableRow key={`skel-${i}`}>
        <TableCell><Skeleton className="h-4 w-6" /></TableCell>
        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      </TableRow>
    ))
  );

  const hasChanges = transformedData.some(item => item.isDirty);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <ToastContainer position="bottom-right" theme="colored" autoClose={3000} hideProgressBar />
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manajemen Daftar Ulang</h1>
            <p className="text-gray-500 mt-1">Kelola nomor urut peserta dan cetak data.</p>
          </div>

          <Card className="shadow-sm no-print">
            <CardHeader>
                <CardTitle className="text-lg">Filter & Aksi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
                  <div className="flex items-center gap-2 text-gray-600">
                      <Filter className="w-5 h-5" />
                      <span className="font-medium">Filter:</span>
                  </div>
                  <Select value={filterKategori} onValueChange={setFilterKategori}>
                      <SelectTrigger className="w-full sm:w-[160px] bg-white"><SelectValue placeholder="Kategori" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Semua">Semua Kategori</SelectItem>
                          <SelectItem value="Wira">Wira</SelectItem>
                          <SelectItem value="Madya">Madya</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select value={filterLomba} onValueChange={setFilterLomba}>
                      <SelectTrigger className="w-full sm:w-[200px] bg-white"><SelectValue placeholder="Mata Lomba" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Semua">Semua Lomba</SelectItem>
                          {lombaKeys.map(key => ( <SelectItem key={key} value={key}>{lombaNames[key]}</SelectItem> ))}
                      </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-[240px]">
                      <Input type="text" placeholder="Cari Sekolah..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button onClick={() => fetchData(true)} variant="outline" size="icon" disabled={loading}>
                              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Refresh Data</p></TooltipContent>
                  </Tooltip>
              </div>
              <div className="flex gap-3 w-full lg:w-auto justify-end pt-4 lg:pt-0">
                  <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-green-600 hover:bg-green-700 text-white">
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                  <Button onClick={handlePrint} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600">
                      <Printer className="mr-2 h-4 w-4" /> Cetak
                  </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className='flex flex-row justify-between items-center'>
                <div>
                    <CardTitle>Data Peserta Daftar Ulang</CardTitle>
                    <CardDescription className='mt-1'>
                        {loading ? "Memuat data..." : `Menampilkan ${filteredData.length} dari total ${transformedData.length} entri data.`}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <Table id="daftar-ulang-table">
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      <TableHead className="w-[50px] text-center"><ListOrdered className="w-4 h-4 inline-block"/></TableHead>
                      <TableHead className="min-w-[200px]">Nama Sekolah</TableHead>
                      <TableHead className="w-[120px] text-center">Kategori</TableHead>
                      <TableHead className="min-w-[180px]">Mata Lomba</TableHead>
                      <TableHead className="w-[80px] text-center">Tim Ke-</TableHead>
                      <TableHead className="w-[150px] text-center">Nomor Urut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? renderTableSkeleton() : (
                      filteredData.length > 0 ? filteredData.map((item, index) => (
                        <TableRow key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${item.isDirty ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                          <TableCell className="text-center font-medium text-gray-700 dark:text-gray-300">{index + 1}</TableCell>
                          <TableCell className="font-medium text-gray-800 dark:text-gray-100">{item.nama_sekolah}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.kategori === 'Wira' ? 'default' : 'secondary'} className='capitalize text-xs'>
                                {item.kategori}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{item.lomba_name}</TableCell>
                          <TableCell className="text-center text-gray-700 dark:text-gray-300">{item.tim_ke}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              value={item.nomor_urut ?? ''}
                              onChange={(e) => handleNomorUrutChange(item.id, e.target.value)}
                              className="w-20 text-center mx-auto h-9 no-print border-gray-300 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              min="1"
                            />
                            <span className='hidden print-only-text'>{item.nomor_urut ?? '-'}</span>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-48 text-gray-500 dark:text-gray-400">
                            <div className='flex flex-col items-center justify-center'>
                                <Users className='w-12 h-12 text-gray-300 dark:text-gray-600 mb-2'/>
                                <p>Tidak ada data ditemukan.</p>
                                <p className='text-xs'>Coba ubah filter atau kata kunci pencarian Anda.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}