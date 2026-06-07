'use client';

import React, { useState, useEffect } from 'react';
import { LOMBA_LIST } from '@/data/lomba'; // Pastikan path ini benar
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  PartyPopper,
  School,       // Ikon untuk Data Sekolah
  Swords,       // Ikon untuk Pilih Lomba
  Users,        // Ikon untuk Data Peserta
  ListChecks,   // Ikon untuk Ringkasan
  CheckCircle2, // Ikon check yang lebih modern
  Phone,        // Ikon untuk WA
  User,         // Ikon untuk Pembina/Peserta
  Building2,    // Ikon lain untuk Sekolah
  Wallet,       // Ikon untuk Biaya
  PlusCircle,   // Ikon tambah
  MinusCircle,  // Ikon kurang
  Check,        // Ikon check sederhana
  HelpCircle,   // Ikon untuk modal
} from 'lucide-react';

// Shadcn/UI Components
import { Button } from '@/components/ui/button';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { supabase } from '@/lib/supabase'; // Pastikan path ini benar

const MotionCard = motion(Card);
const MotionButton = motion(Button);
const steps = [
    { label: 'Data Sekolah', icon: School },
    { label: 'Pilih Lomba', icon: Swords },
    { label: 'Data Peserta', icon: Users },
    { label: 'Ringkasan', icon: ListChecks },
];

// Helper untuk format Rupiah
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

// Varian Animasi untuk List
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Jeda antar item
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
        type: 'spring',
        stiffness: 100,
    }
  },
};

// Varian untuk Input Focus
const inputFocusVariants = {
    rest: { scale: 1 },
    focus: { scale: 1.02, transition: { duration: 0.1 } },
};

export default function DaftarPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formSekolah, setFormSekolah] = useState({
    nama: '',
    pembina: '',
    whatsapp: '',
    kategori: '',
  });
  const [lombaDipilih, setLombaDipilih] = useState<Record<string, number>>({});
  const [peserta, setPeserta] = useState<Record<string, string[][]>>({});
  const [sekolahTerdaftar, setSekolahTerdaftar] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIKA UTAMA (TIDAK DIUBAH, KECUALI PERBAIKAN KECIL) ---
  useEffect(() => {
    const fetchSekolah = async () => {
      const { data, error } = await supabase
        .from('pendaftaran')
        .select('nama_sekolah');
      if (!error && data) {
        setSekolahTerdaftar(data.map((r) => normalize(r.nama_sekolah || '')));
      }
    };
    fetchSekolah();
  }, []);

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/negeri/g, 'n')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

  const handleLombaChange = (id: string, jumlah: number) => {
    const lomba = LOMBA_LIST.find((l) => l.id === id);
    if (!lomba) return;
    const newJumlah = Math.max(0, Math.min(jumlah, 5)); // Maks 5 tim

    setLombaDipilih((prev) => {
      const updated = { ...prev };
      if (newJumlah <= 0) delete updated[id];
      else updated[id] = newJumlah;
      return updated;
    });

    setPeserta((prev) => {
      const updated = { ...prev };
      if (newJumlah <= 0) delete updated[id];
      else {
        const perTim = lomba.maksPesertaPerTim;
        const currentTeams = prev[id] || [];
        updated[id] = Array.from({ length: newJumlah }, (_, i) =>
          currentTeams[i] || Array(perTim).fill('')
        );
      }
      return updated;
    });
  };

  const handlePesertaChange = (
    lombaId: string,
    timIndex: number,
    pesertaIndex: number,
    value: string
  ) => {
    setPeserta((prev) => {
      const updated = { ...prev };
      if (updated[lombaId] && updated[lombaId][timIndex]) {
        updated[lombaId][timIndex][pesertaIndex] = value;
      }
      return updated;
    });
  };

  const totalBayar = Object.entries(lombaDipilih).reduce((acc, [id, jml]) => {
    const lomba = LOMBA_LIST.find((l) => l.id === id);
    return lomba ? acc + lomba.biaya * jml : acc;
  }, 0);

  const next = () => {
    setErrors([]);
    const errs : string[] = [];

    if (currentStep === 0) {
      const { nama, pembina, whatsapp, kategori } = formSekolah;
      if (!nama) errs.push('Nama sekolah wajib diisi.');
      if (!pembina) errs.push('Nama pembina wajib diisi.');
      if (!whatsapp) errs.push('Nomor WhatsApp wajib diisi.');
      if (!kategori) errs.push('Kategori sekolah wajib dipilih.');
      if (sekolahTerdaftar.includes(normalize(nama)))
        errs.push('Sekolah ini sudah terdaftar sebelumnya.');
      if (whatsapp && !/^08\d{8,13}$/.test(formSekolah.whatsapp))
        errs.push('Format Nomor WhatsApp tidak valid (contoh: 081234567890).');
    }

    if (currentStep === 1 && Object.keys(lombaDipilih).length === 0) {
      errs.push('Anda harus memilih minimal satu lomba untuk diikuti.');
    }

    if (currentStep === 2) {
      const kosong: string[] = [];
      Object.entries(peserta).forEach(([id, teams]) => {
        const namaL = LOMBA_LIST.find((l) => l.id === id)?.nama;
        teams.forEach((team, i) => {
          if (team.some((n) => !n.trim()))
            kosong.push(`- ${namaL}, Tim ${i + 1}`);
        });
      });
      if (kosong.length) {
        alert(
          `Data peserta berikut belum lengkap:\n\n${kosong.join('\n')}\n\nSemua nama peserta wajib diisi.`
      );
        return;
      }
    }

      if (errs.length) return setErrors(errs);
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => {
    setErrors([]);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const lanjutKePembayaran = () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    const data = { sekolah: formSekolah, lombaDipilih, peserta, totalBayar };
    localStorage.setItem('formPendaftaran', JSON.stringify(data));
    setTimeout(() => {
        window.location.href = '/pembayaran';
    }, 500);
  };

  const submit = () => lanjutKePembayaran();
  // --- AKHIR LOGIKA UTAMA ---

  // --- Fungsi Render ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step0"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Card className="shadow-lg border-t-4 border-t-blue-500 overflow-hidden">
              <CardHeader className="bg-blue-50/50">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <School className="text-blue-600"/> Data Sekolah & Pembina
                </CardTitle>
                <CardDescription>
                  Lengkapi informasi dasar mengenai asal sekolah dan penanggung jawab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label htmlFor="nama-sekolah" className="font-semibold flex items-center gap-1"><Building2 size={16}/> Nama Sekolah</Label>
                  <motion.div variants={inputFocusVariants} initial="rest" whileHover="focus" whileFocus="focus">
                  <Input id="nama-sekolah" type="text" placeholder="Contoh: SMAN 1 Indonesia" value={formSekolah.nama}
                    onChange={(e) => setFormSekolah({ ...formSekolah, nama: e.target.value })}
                    className="py-6 text-base" />
                  </motion.div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nama-pembina" className="font-semibold flex items-center gap-1"><User size={16}/> Nama Pembina/Pelatih</Label>
                    <motion.div variants={inputFocusVariants} initial="rest" whileHover="focus" whileFocus="focus">
                    <Input id="nama-pembina" type="text" placeholder="Budi Santoso" value={formSekolah.pembina}
                      onChange={(e) => setFormSekolah({ ...formSekolah, pembina: e.target.value })}
                      className="py-6 text-base" />
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="font-semibold flex items-center gap-1"><Phone size={16}/> Nomor WhatsApp</Label>
                    <motion.div variants={inputFocusVariants} initial="rest" whileHover="focus" whileFocus="focus">
                    <Input id="whatsapp" type="tel" placeholder="081234567890" value={formSekolah.whatsapp}
                      onChange={(e) => setFormSekolah({ ...formSekolah, whatsapp: e.target.value.replace(/\D/g, ''), })} // Hanya angka
                      className="py-6 text-base" />
                    </motion.div>
                  </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="kategori" className="font-semibold">Kategori Sekolah</Label>
                    <Select value={formSekolah.kategori} onValueChange={(value) => setFormSekolah({ ...formSekolah, kategori: value })}>
                        <SelectTrigger id="kategori" className="py-6 text-base">
                            <SelectValue placeholder="Pilih Kategori Sekolah (Wira/Madya)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Wira">Wira (SMA/SMK Sederajat)</SelectItem>
                            <SelectItem value="Madya">Madya (SMP Sederajat)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Card className="shadow-lg border-t-4 border-t-blue-500 overflow-hidden">
              <CardHeader className="bg-blue-50/50">
                <CardTitle className="text-2xl font-bold flex items-center gap-2"><Swords className="text-blue-600"/> Pilih Mata Lomba</CardTitle>
                <CardDescription>
                  Pilih lomba yang akan diikuti. Anda bisa mendaftarkan hingga 5 tim per lomba.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                  {LOMBA_LIST.map((lomba) => (
                    <motion.div key={lomba.id} variants={itemVariants}>
                      <MotionCard
                        whileHover={{ scale: 1.03, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`border-2 rounded-xl overflow-hidden cursor-pointer h-full flex flex-col justify-between
                                  ${lombaDipilih[lomba.id] > 0
                                    ? 'border-green-500 bg-green-50/30 ring-2 ring-green-300'
                                    : 'border-gray-200 hover:border-gray-300'}`
                                }
                      >
                          <CardHeader className="p-4 border-b">
                              <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-lg">{lomba.nama}</h3>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                                      <Wallet size={12}/>{formatRupiah(lomba.biaya)}
                                  </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{lomba.keterangan}</p>
                          </CardHeader>
                          <CardContent className="p-6 flex-grow">
                              <Label htmlFor={`lomba-${lomba.id}`} className="flex flex-col sm:flex-row justify-between items-center text-sm font-medium">
                                  <span className="mb-2 sm:mb-0">Jumlah Tim (Maks. 5):</span>
                                  <div className="flex items-center gap-2">
                                      <Button
                                          variant="outline" size="icon" className="h-9 w-9 rounded-full"
                                          onClick={() => handleLombaChange(lomba.id, (lombaDipilih[lomba.id] || 0) - 1)}
                                      > <MinusCircle size={16}/> </Button>
                                      <Input id={`lomba-${lomba.id}`} type="number" min={0} max={5} value={lombaDipilih[lomba.id] || 0}
                                        onChange={(e) => handleLombaChange(lomba.id, parseInt(e.target.value) || 0)}
                                        className="w-16 h-9 text-center text-xl font-bold border-gray-300 focus:ring-green-500 focus:border-green-500"
                                      />
                                        <Button
                                          variant="outline" size="icon" className="h-9 w-9 rounded-full"
                                          onClick={() => handleLombaChange(lomba.id, (lombaDipilih[lomba.id] || 0) + 1)}
                                      > <PlusCircle size={16}/> </Button>
                                  </div>
                              </Label>
                          </CardContent>
                            {lombaDipilih[lomba.id] > 0 && (
                                <div className="p-2 bg-green-600 text-white text-xs font-bold text-center flex items-center justify-center gap-1">
                                    <CheckCircle2 size={14}/> TERPILIH ({lombaDipilih[lomba.id]} Tim)
                                </div>
                            )}
                        </MotionCard>
                      </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
              <Card className="shadow-lg border-t-4 border-t-blue-500 overflow-hidden">
                  <CardHeader className="bg-blue-50/50">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2"><Users className="text-blue-600"/> Input Data Peserta</CardTitle>
                    <CardDescription>
                        Masukkan nama lengkap anggota tim. Jika belum ada, isi sementara dan hubungi panitia untuk update.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                      {Object.keys(peserta).length === 0 ? (
                          <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
                              <Users size={48} className="mx-auto text-gray-400 mb-4" />
                              <h3 className="text-lg font-semibold text-gray-700">Belum Ada Lomba Dipilih</h3>
                              <p className="text-sm text-gray-500">Silakan kembali ke langkah sebelumnya untuk memilih lomba terlebih dahulu.</p>
                              <Button variant="outline" className="mt-4" onClick={prev}>
                                  <ChevronLeft className="mr-2 h-4 w-4"/> Kembali Pilih Lomba
                              </Button>
                          </div>
                      ) : (
                          <Accordion type="multiple" className="w-full space-y-4">
                              {Object.entries(peserta).map(([id, teams]) => {
                                  const lomba = LOMBA_LIST.find((l) => l.id === id);
                                  if (!lomba) return null;
                                return (
                                  <AccordionItem key={id} value={id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
                                      <AccordionTrigger className="p-4 font-semibold text-lg hover:no-underline bg-white hover:bg-gray-50 transition-colors">
                                          <div className="flex justify-between items-center w-full">
                                              <span>{lomba.nama}</span>
                                              <Badge variant="outline">{teams.length} Tim</Badge>
                                          </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="p-4 border-t bg-gray-50/50">
                                          <motion.div
                                              className="space-y-6"
                                              variants={containerVariants}
                                              initial="hidden"
                                              animate="visible"
                                          >
                                            {teams.map((team, ti) => (
                                              <motion.div key={ti} variants={itemVariants} className="p-4 border rounded-md bg-white shadow-xs">
                                                  <div className="flex justify-between items-center mb-3">
                                                      <h5 className="font-medium text-gray-800">Tim {ti + 1}</h5>
                                                      <Badge variant={team.filter(Boolean).length === lomba.maksPesertaPerTim ? "default" : "secondary"} className="text-xs">
                                                          {team.filter(Boolean).length} / {lomba.maksPesertaPerTim} Anggota
                                                      </Badge>
                                                  </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                      {team.map((name, j) => (
                                                          <div key={j} className="space-y-1">
                                                              <Label htmlFor={`peserta-${id}-${ti}-${j}`} className="text-xs text-gray-600 flex items-center gap-1">
                                                                  <User size={12}/> Anggota {j + 1}
                                                              </Label>
                                                              <motion.div variants={inputFocusVariants} initial="rest" whileHover="focus" whileFocus="focus">
                                                              <Input id={`peserta-${id}-${ti}-${j}`} type="text" placeholder={`Nama Anggota ${j + 1}`} value={name}
                                                                  onChange={(e) => handlePesertaChange(id, ti, j, e.target.value)}
                                                                  className="py-5" />
                                                              </motion.div>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </motion.div>
                                            ))}
                                          </motion.div>
                                      </AccordionContent>
                                  </AccordionItem>
                                )
                              })}
                          </Accordion>
                      )}
                  </CardContent>
                </Card>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
              <Card className="shadow-lg border-t-4 border-t-blue-500 overflow-hidden">
                  <CardHeader className="text-center bg-blue-50/50">
                      <PartyPopper className="mx-auto h-12 w-12 text-blue-600 animate-bounce"/>
                      <CardTitle className="text-2xl font-bold mt-2 flex items-center justify-center gap-2">
                          <ListChecks className="text-blue-600"/> Ringkasan Pendaftaran
                      </CardTitle>
                      <CardDescription>
                          Satu langkah lagi! Periksa kembali data Anda sebelum finalisasi.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                      <div className="p-4 border rounded-lg bg-gray-50 shadow-inner">
                          <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2"><School size={16}/> Data Sekolah</h4>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                              <div className="flex flex-col"><dt className="font-medium text-gray-500">Nama Sekolah:</dt><dd className="text-gray-900">{formSekolah.nama || '-'}</dd></div>
                              <div className="flex flex-col"><dt className="font-medium text-gray-500">Nama Pembina:</dt><dd className="text-gray-900">{formSekolah.pembina || '-'}</dd></div>
                                <div className="flex flex-col"><dt className="font-medium text-gray-500">No. WhatsApp:</dt><dd className="text-gray-900">{formSekolah.whatsapp ? `${formSekolah.whatsapp}` : '-'}</dd></div>
                                <div className="flex flex-col"><dt className="font-medium text-gray-500">Kategori:</dt><dd className="text-gray-900 font-medium">{formSekolah.kategori || '-'}</dd></div>
                          </dl>
                      </div>

                      <div className="p-4 border rounded-lg bg-white shadow-sm">
                          <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2"><Wallet size={16}/> Rincian Biaya</h4>
                          <div className="space-y-3">
                          {Object.entries(lombaDipilih).map(([id, j]) => {
                              const l = LOMBA_LIST.find((x) => x.id === id);
                              return l ? (
                              <motion.div
                                  key={id}
                                  className="flex justify-between items-center text-sm border-b pb-3 last:border-b-0"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 * Object.keys(lombaDipilih).indexOf(id) }}
                              >
                                  <div>
                                      <p className="font-medium text-gray-900">{l.nama}</p>
                                      <p className="text-xs text-gray-500">({j} tim x {formatRupiah(l.biaya)})</p>
                                  </div>
                                  <span className="font-medium text-gray-900">{formatRupiah(l.biaya * j)}</span>
                              </motion.div>
                              ) : null;
                          })}
                          {Object.keys(lombaDipilih).length === 0 && (
                              <p className="text-center text-gray-500 py-4">Belum ada lomba yang dipilih.</p>
                          )}
                          <div className="border-t-2 border-dashed pt-4 mt-4 flex justify-between font-bold text-xl text-blue-700">
                              <span>TOTAL</span>
                              <span>{formatRupiah(totalBayar)}</span>
                          </div>
                          </div>
                      </div>
                  </CardContent>
                </Card>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <motion.div
            className="text-center pt-16"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Formulir Pendaftaran Lomba
            </h1>
            <p className="mt-4 text-lg leading-6 text-gray-600">
                Ikuti 4 langkah mudah untuk mendaftarkan kontingen sekolah Anda.
            </p>
        </motion.div>

        {/* ======== BAGIAN STEPPER YANG DIPERBAIKI ======== */}
        <div className="p-4 bg-white rounded-lg sm:rounded-full shadow-md border">
          <div className="flex flex-col sm:flex-row items-center sm:justify-around"> {/* sm:justify-around atau sm:justify-between */}
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                {/* Step Item: Ikon di atas, Label di bawah (konsisten) */}
                <div className="flex flex-col items-center text-center py-2 sm:py-0 sm:px-2 w-full sm:w-auto sm:flex-1">
                  {/* Lingkaran Ikon */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 
                                flex-shrink-0 transition-all duration-300
                      ${
                        i < currentStep
                          ? 'bg-green-600 text-white border-green-600'
                          : i === currentStep
                          ? 'bg-blue-500 text-white border-blue-600 scale-110 shadow-lg'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                  >
                    {i < currentStep ? <Check size={20} /> : <step.icon size={18} />}
                  </div>
                  {/* Label Step */}
                  <p
                    className={`text-xs mt-1 sm:mt-2 transition-all duration-300 break-words w-20 sm:w-auto
                      ${
                        i <= currentStep ? 'font-semibold text-gray-900' : 'text-gray-500'
                      }`}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Garis Penghubung */}
                {i < steps.length - 1 && (
                  <>
                    {/* Garis untuk mobile (vertikal) */}
                    <div className={`w-0.5 h-6 my-1 sm:hidden rounded-full transition-all duration-500 ease-in-out
                                    ${i < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {/* Garis untuk desktop (horizontal) */}
                    <div className={`hidden sm:block flex-1 h-0.5 my-auto rounded-full transition-all duration-500 ease-in-out
                                    ${i < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* ======== AKHIR BAGIAN STEPPER ======== */}


        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-xl border border-gray-100 min-h-[450px]">
            <AnimatePresence mode="wait">
                {renderStepContent()}
            </AnimatePresence>
        </div>

        {errors.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Alert variant="destructive" className="shadow-md border-l-4 border-l-sky-600">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Oops! Perlu Perhatian</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5 space-y-1">
                            {errors.map((e, idx) => (
                                <li key={idx}>{e}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            </motion.div>
        )}

        <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
            <AlertDialogContent className="rounded-xl">
                <AlertDialogHeader>
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                        <HelpCircle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                    </div>
                    <AlertDialogTitle className="text-xl font-semibold">Konfirmasi Lanjutan</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription className="whitespace-pre-line text-base text-gray-600 py-4">
                  {confirmMessage}
                </AlertDialogDescription>
                <AlertDialogFooter className="sm:justify-end gap-2">
                    <AlertDialogCancel asChild>
                        <Button variant="outline">Kembali & Perbaiki</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button onClick={lanjutKePembayaran} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Check className="mr-2 h-4 w-4"/> Ya, Lanjutkan Saja
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-10 p-5 bg-white rounded-xl shadow-lg border-t-2 border-gray-100 gap-4">
            <MotionButton
              variant="outline"
              size="lg"
              disabled={currentStep === 0 || isSubmitting}
              onClick={prev}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Kembali
            </MotionButton>

            {currentStep < steps.length - 1 ? (
              <MotionButton
                size="lg"
                onClick={next}
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
              >
                Selanjutnya
                <ChevronRight className="ml-2 h-4 w-4" />
              </MotionButton>
            ) : (
              <MotionButton
                size="lg"
                onClick={submit}
                disabled={isSubmitting || totalBayar === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto disabled:opacity-50"
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                    </>
                ) : (
                    <>
                        Lanjut ke Pembayaran
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                )}
              </MotionButton>
            )}
        </div>
      </div>
    </div>
  );
}