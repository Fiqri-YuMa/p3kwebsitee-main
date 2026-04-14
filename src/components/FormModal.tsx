'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { LOMBA_LIST } from '@/data/lomba'; // Pastikan path ini benar
import { motion, AnimatePresence } from 'framer-motion';

// Lucide React Icons
import {
  X,
  Loader2,
  AlertTriangle,
  School,
  Swords,
  // Users, // Dihapus karena tidak digunakan lagi
  Wallet,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

// Shadcn/UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
// Accordion tidak digunakan lagi jika hanya data peserta yang menggunakannya
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const MotionButton = motion(Button);

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  data?: any;
  onSuccess: () => void;
}

const initialFormData = {
  nama_sekolah: '',
  pembina: '',
  whatsapp: ' ', // Pertimbangkan untuk mengubah default menjadi string kosong '' jika lebih sesuai
  kategori: '',
  tandu_putra: 0,
  tandu_putri: 0,
  pertolongan_pertama: 0,
  senam_poco_poco: 0,
  mojang_jajaka: 0,
  poster: 0,
  pmr_cerdas: 0,
  total: 0,
};

export default function FormModal({ open, onClose, data, onSuccess }: FormModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  // const [peserta, setPeserta] = useState<Record<string, string[][]>>({}); // Dihapus
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (data) {
      setFormData({
        nama_sekolah: data.nama_sekolah || '',
        pembina: data.pembina || '',
        whatsapp: data.whatsapp || ' ',
        kategori: data.kategori || '',
        tandu_putra: data.tandu_putra || 0,
        tandu_putri: data.tandu_putri || 0,
        pertolongan_pertama: data.pertolongan_pertama || 0,
        senam_poco_poco: data.senam_poco_poco || 0,
        mojang_jajaka: data.mojang_jajaka || 0,
        poster: data.poster || 0,
        pmr_cerdas: data.pmr_cerdas || 0,
        total: data.total || 0,
      });
      // setPeserta(data.peserta || {}); // Dihapus
    } else {
      setFormData(initialFormData);
      // setPeserta({}); // Dihapus
    }
    setErrors([]);
  }, [data, open]);

  const total = useMemo(() => {
    return LOMBA_LIST.reduce((acc, lomba) => {
      const fieldName = lomba.id.replace(/-/g, '_');
      const jumlah = formData[fieldName as keyof typeof formData] as number;
      return acc + (lomba.biaya * (jumlah || 0));
    }, 0);
  }, [formData]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, total }));
  }, [total]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // const handlePesertaChange = (lombaId: string, timIndex: number, pesertaIndex: number, value: string) => { // Dihapus
  //   setPeserta(prev => {
  //     const updated = JSON.parse(JSON.stringify(prev));
  //     if (!updated[lombaId]) updated[lombaId] = [];
  //     if (!updated[lombaId][timIndex]) {
  //       const lomba = LOMBA_LIST.find(l => l.id === lombaId);
  //       updated[lombaId][timIndex] = Array(lomba?.maksPesertaPerTim || 0).fill('');
  //     }
  //     updated[lombaId][timIndex][pesertaIndex] = value;
  //     return updated;
  //   });
  // };

  const validateForm = () => {
    const currentErrors: string[] = [];
    if (!formData.nama_sekolah.trim()) currentErrors.push('Nama sekolah harus diisi');
    if (!formData.pembina.trim()) currentErrors.push('Nama pembina harus diisi');
    if (!formData.whatsapp.trim() || !/^\+?\d{10,15}$/.test(formData.whatsapp)) currentErrors.push('Nomor WhatsApp tidak valid (contoh: +6281234567890 atau 081234567890)');
    if (!formData.kategori) currentErrors.push('Kategori harus dipilih');

    let adaLombaDipilih = false;
    LOMBA_LIST.forEach(lomba => {
        const fieldName = lomba.id.replace(/-/g, '_') as keyof typeof formData;
        if (Number(formData[fieldName]) > 0) {
            adaLombaDipilih = true;
        }
    });
    if (!adaLombaDipilih && !data) { // Hanya validasi jika ini bukan edit dan tidak ada lomba dipilih
        currentErrors.push('Minimal pilih satu lomba untuk diikuti.');
    }

    // Validasi data peserta dihapus
    // Object.entries(peserta).forEach(([lombaId, tims]) => {
    //   const lomba = LOMBA_LIST.find(l => l.id === lombaId);
    //   const fieldName = lombaId.replace(/-/g, '_') as keyof typeof formData;
    //   const jumlahTim = Number(formData[fieldName]);
    //   if (lomba && jumlahTim > 0) {
    //     tims.slice(0, jumlahTim).forEach((tim, timIndex) => {
    //       tim.forEach((nama, pesertaIndex) => {
    //         if (!nama.trim()) {
    //           currentErrors.push(`Nama anggota ${pesertaIndex + 1} Tim ${timIndex + 1} ${lomba.nama} belum diisi`);
    //         }
    //       });
    //     });
    //   }
    // });
    setErrors(currentErrors);
    return currentErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const nomor = `P3K${new Date().getFullYear()}-${formData.nama_sekolah.replace(/\s+/g, '').toUpperCase().slice(0, 10)}-${Date.now()}`;
      const pendaftaranPayload: any = {
        // nomor: data?.nomor || nomor, // Jika edit, gunakan nomor yang sudah ada, jika baru, generate
        nama_sekolah: formData.nama_sekolah,
        pembina: formData.pembina,
        whatsapp: formData.whatsapp,
        kategori: formData.kategori,
        total: formData.total,
      };

      // Hanya tambahkan nomor jika ini adalah data baru
      if (!data?.id) {
        pendaftaranPayload.nomor = nomor;
      }


      LOMBA_LIST.forEach(l => {
        const field = l.id.replace(/-/g, '_');
        pendaftaranPayload[field] = formData[field as keyof typeof formData];
      });

      let pendaftaranId;
      if (data?.id) {
        const { data: pendaftaranData, error: pendaftaranError } = await supabase
            .from('pendaftaran')
            .update(pendaftaranPayload)
            .eq('id', data.id)
            .select()
            .single();
        if (pendaftaranError || !pendaftaranData) throw new Error(pendaftaranError?.message || 'Gagal mengupdate data pendaftaran');
        pendaftaranId = pendaftaranData.id;

        // Hapus data peserta yang mungkin ada sebelumnya jika skema DB Anda mengharuskannya saat mengedit
        // Jika data peserta tidak lagi dikelola di sini, baris ini mungkin tidak diperlukan atau perlu penyesuaian
        // await supabase.from('peserta').delete().eq('pendaftaran_id', pendaftaranId); // Dihapus atau dikomentari jika tidak relevan lagi

      } else {
        const { data: pendaftaranData, error: pendaftaranError } = await supabase
            .from('pendaftaran')
            .insert(pendaftaranPayload)
            .select()
            .single();
        if (pendaftaranError || !pendaftaranData) throw new Error(pendaftaranError?.message || 'Gagal menyimpan data pendaftaran');
        pendaftaranId = pendaftaranData.id;
      }

      // Logika untuk insert peserta dihapus
      // const pesertaToInsert = Object.entries(peserta)
      //   .flatMap(([lombaId, tims]) => {
      //     const lomba = LOMBA_LIST.find(l => l.id === lombaId);
      //     const fieldName = lombaId.replace(/-/g, '_') as keyof typeof formData;
      //     const jumlahTimAktif = Number(formData[fieldName]);

      //     return tims.slice(0, jumlahTimAktif).flatMap((tim) => 
      //       tim.filter(nama => nama.trim()).map(nama => ({
      //         pendaftaran_id: pendaftaranId,
      //         nama_sekolah: formData.nama_sekolah,
      //         lomba: lomba?.nama || lombaId,
      //         data_peserta: nama.trim()
      //       }))
      //     );
      //   });

      // if (pesertaToInsert.length > 0) {
      //   const { error: pesertaError } = await supabase.from('peserta').insert(pesertaToInsert);
      //   if (pesertaError) throw new Error(pesertaError.message || 'Gagal menyimpan data peserta');
      // }

      if(!data?.id && !data?.kwitansi_url){
        const response = await fetch(`/api/generate-kwitansi?nomor=${pendaftaranPayload.nomor || nomor}`); // Gunakan nomor yang pasti ada
        if (!response.ok) { const errorText = await response.text(); throw new Error(`Gagal membuat kwitansi: ${errorText}`); }
        const responseData = await response.json();
        if (!responseData?.success) throw new Error(responseData?.message || 'Gagal mendapatkan URL kwitansi');
        const { error: updateError } = await supabase.from('pendaftaran').update({ kwitansi_url: responseData.kwitansi_url }).eq('id', pendaftaranId);
        if (updateError) throw new Error('Gagal menyimpan URL kwitansi');
      }

      alert(data?.id ? 'Pendaftaran berhasil diupdate!' : 'Pendaftaran berhasil disimpan! Kwitansi telah dibuat (jika baru).');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error:', err);
      setErrors([err.message || 'Terjadi kesalahan saat menyimpan data']);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-4xl rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-10 rounded-t-xl">
                <div>
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    {data ? 'Edit Pendaftaran' : 'Formulir Pendaftaran Baru'}
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 mt-1">
                    Pastikan semua data terisi dengan benar.
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup modal">
                  <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-8">
                <AnimatePresence>
                  {errors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Perhatian!</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm">
                            {errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><School className="h-5 w-5 text-blue-600"/>Data Sekolah</CardTitle>
                    <CardDescription>Informasi dasar mengenai sekolah dan pembina.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="nama_sekolah">Nama Sekolah</Label>
                      <Input id="nama_sekolah" name="nama_sekolah" value={formData.nama_sekolah} onChange={handleChange} placeholder="Contoh: SMAN 1 Cianjur" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pembina">Nama Pembina/Pelatih</Label>
                      <Input id="pembina" name="pembina" value={formData.pembina} onChange={handleChange} placeholder="Contoh: Budi Santoso" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp">No. WhatsApp Pembina (Aktif)</Label>
                      <Input id="whatsapp" name="whatsapp"  type="tel" value={formData.whatsapp} onChange={handleChange} placeholder="08123456789" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="kategori">Kategori Sekolah</Label>
                      <Select name="kategori" value={formData.kategori} onValueChange={(value) => handleSelectChange('kategori', value)} required>
                        <SelectTrigger id="kategori">
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Madya">Madya (SMP/MTs Sederajat)</SelectItem>
                          <SelectItem value="Wira">Wira (SMA/SMK/MA Sederajat)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><Swords className="h-5 w-5 text-green-600"/>Pilihan Lomba</CardTitle>
                    <CardDescription>Tentukan jumlah tim untuk setiap mata lomba yang diikuti (Maksimal 3 tim per lomba).</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {LOMBA_LIST.map((lomba) => {
                      const fieldName = lomba.id.replace(/-/g, '_');
                      const currentValue = formData[fieldName as keyof typeof formData] as number || 0;
                      return (
                        <div key={lomba.id} className="p-4 rounded-lg border bg-gray-50/50 space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor={fieldName} className="font-semibold text-gray-800">{lomba.nama}</Label>
                            <Badge variant="secondary" className="text-xs">
                              Rp{lomba.biaya.toLocaleString('id-ID')}
                            </Badge>
                          </div>
                           <p className="text-xs text-gray-500">{lomba.keterangan}</p>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleChange({ target: { name: fieldName, value: String(Math.max(0, currentValue - 1)), type: 'number' } } as any)}>
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <Input
                              id={fieldName}
                              name={fieldName}
                              type="number"
                              value={currentValue}
                              onChange={handleChange}
                              min="0"
                              max="3" // Anda bisa mengambil batas maksimal tim dari LOMBA_LIST jika ada
                              className="w-16 h-8 text-center font-semibold"
                            />
                             <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleChange({ target: { name: fieldName, value: String(Math.min(3, currentValue + 1)), type: 'number' } } as any)}>
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Bagian Data Peserta Dihapus Seluruhnya */}
                {/* {LOMBA_LIST.some(l => (formData[l.id.replace(/-/g, '_') as keyof typeof formData] as number || 0) > 0) && (
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2"><Users className="h-5 w-5 text-purple-600"/>Data Peserta</CardTitle>
                      <CardDescription>Isi nama lengkap anggota tim. Jika belum ada, bisa dikosongkan sementara.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full space-y-3">
                        {LOMBA_LIST.map((lomba) => {
                          // ... Konten Accordion untuk data peserta ...
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
                )} */}

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 shadow">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-slate-600"/>Total Pembayaran
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      Rp{formData.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </form>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white/80 backdrop-blur-md z-10 rounded-b-xl">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Batal
                </Button>
                <MotionButton
                  type="submit" // Ini akan men-trigger onSubmit dari form
                  onClick={handleSubmit} // Bisa juga langsung panggil handleSubmit jika tidak di dalam form tag
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    data ? 'Update Pendaftaran' : 'Simpan Pendaftaran'
                  )}
                </MotionButton>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}