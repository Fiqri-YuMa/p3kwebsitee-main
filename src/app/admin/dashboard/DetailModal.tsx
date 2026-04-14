// app/admin/dashboard/DetailModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { 
    User, 
    Phone, 
    Tag, 
    ShieldCheck, 
    ListCollapse, 
    DollarSign, 
    Paperclip, 
    Users as UsersIcon, 
    FileText,
    ImageIcon,
    Loader2,
    ShieldAlert,
    ShieldQuestion,
    ExternalLink,
    Info, // Untuk link eksternal
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';

type Pendaftar = {
  id: string;
  nama_sekolah: string;
  pembina: string;
  whatsapp: string;
  kategori: string;
  tandu_putra: number;
  tandu_putri: number;
  pertolongan_pertama: number;
  senam_poco_poco: number;
  mojang_jajaka: number;
  poster: number;
  pmr_cerdas: number;
  total: number;
  bukti: string;
  nama_pengirim: string;
  status_verifikasi: string;
};

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  data: Pendaftar | null;
}

const DetailItem = ({ 
    label, 
    value, 
    icon: Icon, 
    valueClassName,
    isLink = false,
    href = "#"
}: { 
    label: string; 
    value: React.ReactNode; 
    icon?: React.ElementType; 
    valueClassName?: string;
    isLink?: boolean;
    href?: string;
}) => (
  <div className="py-2.5 grid grid-cols-1 md:grid-cols-3 md:gap-x-4 items-start"> 
    <dt className="text-sm font-medium text-slate-600 flex items-center">
      {Icon && <Icon className="h-4 w-4 mr-2 flex-shrink-0 text-slate-500" />}
      {label}
    </dt>
    <dd className={`mt-1 text-sm text-slate-900 md:col-span-2 md:mt-0 break-words ${valueClassName || ''}`}>
        {isLink && typeof value === 'string' ? (
            <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
                {value} <ExternalLink size={14}/>
            </a>
        ) : value}
    </dd>
  </div>
);

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

export default function DetailModal({ open, onClose, data }: DetailModalProps) {
  const [pesertaPerLomba, setPesertaPerLomba] = useState<Record<string, any[]>>({});
  const [isPesertaLoading, setIsPesertaLoading] = useState(false);

  useEffect(() => {
    const fetchPeserta = async () => {
      if (!data?.id) return;
      setIsPesertaLoading(true);
      const { data: pesertaData, error } = await supabase
        .from('peserta')
        .select('lomba, data_peserta')
        .eq('pendaftaran_id', data.id);

      if (error) {
        console.error('Gagal mengambil data peserta:', error.message);
        setPesertaPerLomba({});
      } else {
        const grouped: Record<string, any[]> = {};
        pesertaData.forEach(p => {
          if (!grouped[p.lomba]) grouped[p.lomba] = [];
          grouped[p.lomba].push(p);
        });
        setPesertaPerLomba(grouped);
      }
      setIsPesertaLoading(false);
    };

    if (open && data?.id) {
      fetchPeserta();
    } else {
      setPesertaPerLomba({});
    }
  }, [open, data]);

  if (!data) return null;

  const kegiatanLomba = [
    { label: 'Tandu Putra', value: data.tandu_putra, key: 'tandu_putra' },
    { label: 'Tandu Putri', value: data.tandu_putri, key: 'tandu_putri' },
    { label: 'Pertolongan Pertama', value: data.pertolongan_pertama, key: 'pertolongan_pertama' },
    { label: 'Senam Poco-Poco', value: data.senam_poco_poco, key: 'senam_poco_poco' },
    { label: 'Mojang Jajaka', value: data.mojang_jajaka, key: 'mojang_jajaka' },
    { label: 'Poster', value: data.poster, key: 'poster' },
    { label: 'PMR Cerdas', value: data.pmr_cerdas, key: 'pmr_cerdas' },
  ].filter(k => k.value > 0);

  const buktiUrl = data.bukti?.startsWith('http')
    ? data.bukti
    : data.bukti ? `https://llvesnxqpifjjrcecnxj.supabase.co/storage/v1/object/public/bukti-pembayaran/bukti/${data.bukti}` : null;

  const getStatusBadge = (status: string | null) => {
    let icon = <ShieldQuestion className="h-3.5 w-3.5 mr-1.5"/>;
    let className = "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100 font-medium";
    let text = status || 'Belum Ada Status';

    switch (status?.toLowerCase()) {
      case 'verified':
        icon = <ShieldCheck className="h-3.5 w-3.5 mr-1.5"/>;
        className = "bg-green-100 text-green-800 border-green-300 hover:bg-green-100 font-semibold";
        text = "Terverifikasi";
        break;
      case 'pending':
        icon = <ShieldQuestion className="h-3.5 w-3.5 mr-1.5"/>;
        className = "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 font-semibold";
        text = "Pending";
        break;
      case 'rejected':
        icon = <ShieldAlert className="h-3.5 w-3.5 mr-1.5"/>;
        className = "bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-100 font-semibold";
        text = "Ditolak";
        break;
    }
    return <Badge className={`${className} text-xs sm:text-sm py-0.5 px-2.5`}>{icon} {text}</Badge>;
  };
  
  const normalizeWhatsappLink = (wa: string) => {
    let num = wa.replace(/\D/g, ''); // Hapus semua non-digit
    if (num.startsWith('0')) {
      num = '62' + num.substring(1);
    } else if (!num.startsWith('62')) {
      num = '62' + num;
    }
    return `https://wa.me/${num}`;
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-lg">
          <DialogTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-3 text-slate-800">
            <FileText className="h-6 w-6 text-blue-600" />
            Detail Pendaftaran
          </DialogTitle>
          {data.nama_sekolah && <DialogDescription className="text-sm sm:text-base font-medium text-blue-700 -mt-1">{data.nama_sekolah}</DialogDescription>}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-120px)] sm:max-h-[70vh]"> {/* Sesuaikan max-h */}
          <div className="p-6 space-y-6">
            
            {/* Informasi Umum */}
            <div className="p-4 border rounded-lg bg-slate-50">
              <h3 className="text-lg font-semibold mb-3 text-slate-700 flex items-center gap-2">
                <Info className="h-5 w-5 text-slate-500"/>Informasi Umum
              </h3>
              <DetailItem label="Pembina" value={data.pembina || '-'} icon={User}/>
              <Separator className="my-1.5" />
              <DetailItem 
                label="No. WhatsApp" 
                value={data.whatsapp || '-'} 
                icon={Phone}
                isLink={!!data.whatsapp}
                href={data.whatsapp ? normalizeWhatsappLink(data.whatsapp) : undefined}
                valueClassName={data.whatsapp ? "text-blue-600 font-medium" : ""}
              />
              <Separator className="my-1.5" />
              <DetailItem label="Kategori" value={<Badge variant="outline" className="text-sm font-medium py-0.5 px-2.5 border-slate-400 text-slate-700">{data.kategori || '-'}</Badge>} icon={Tag}/>
              <Separator className="my-1.5" />
              <DetailItem label="Status Verifikasi" value={getStatusBadge(data.status_verifikasi)} icon={ShieldCheck}/>
            </div>

            {/* Lomba & Pembayaran */}
            {(kegiatanLomba.length > 0 || data.total > 0) && (
              <div className="p-4 border rounded-lg bg-slate-50">
                 <h3 className="text-lg font-semibold mb-3 text-slate-700 flex items-center gap-2">
                    <ListCollapse className="h-5 w-5 text-slate-500"/>Rincian Lomba & Biaya
                </h3>
                {kegiatanLomba.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {kegiatanLomba.map((kegiatan) => (
                            <div key={kegiatan.key} className="flex justify-between items-center text-sm py-1">
                                <span className="text-slate-700">{kegiatan.label}</span>
                                <Badge variant="secondary" className="font-semibold">{kegiatan.value} Tim</Badge>
                            </div>
                        ))}
                    </div>
                )}
                <Separator className="my-3 border-dashed" />
                <div className="flex justify-between items-center pt-2">
                    <span className="text-md font-semibold text-slate-800 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                        TOTAL PEMBAYARAN
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-green-700">
                        {formatRupiah(data.total || 0)}
                    </span>
                </div>
              </div>
            )}
            
            {/* Bukti Pembayaran & Pengirim */}
            <div className="p-4 border rounded-lg bg-slate-50">
              <h3 className="text-lg font-semibold mb-3 text-slate-700 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-slate-500"/>Pembayaran & Pengirim
              </h3>
              <DetailItem label="Nama Pengirim" value={data.nama_pengirim || 'Tidak ada data'} icon={User} />
              <Separator className="my-1.5" />
              <div className="py-2.5">
                <div className="text-sm font-medium text-slate-600 flex items-center mb-2">
                    <ImageIcon className="h-4 w-4 mr-2 text-slate-500" /> Bukti Pembayaran
                </div>
                {buktiUrl ? (
                  <div className="mt-1 space-y-3">
                    <a href={buktiUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-xs sm:max-w-sm md:max-w-md rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition group">
                        <Image
                            src={buktiUrl}
                            alt="Bukti Pembayaran"
                            className="object-contain w-full h-auto transition-transform group-hover:scale-105"
                            width={450} 
                            height={280} 
                            unoptimized 
                        />
                    </a>
                     <Button variant="outline" size="sm" asChild className="text-xs">
                        <a href={buktiUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5"/> Lihat Ukuran Penuh
                        </a>
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1 pl-6">
                    <Badge variant="destructive" className="font-normal">Tidak ada bukti pembayaran</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Data Peserta */}
            <div className="p-4 border rounded-lg bg-slate-50">
                <h3 className="text-lg font-semibold mb-3 text-slate-700 flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-slate-500"/>Data Peserta
                </h3>
              {isPesertaLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/> Memuat data peserta...
                </div>
              ) : Object.keys(pesertaPerLomba).length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-1.5">
                  {Object.entries(pesertaPerLomba).map(([lomba, listPeserta]) => (
                    <AccordionItem value={lomba} key={lomba} className="border-b-0 rounded-md bg-white border shadow-sm data-[state=open]:shadow-md">
                      <AccordionTrigger className="text-sm sm:text-md font-semibold hover:no-underline px-4 py-3 rounded-md hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between w-full items-center">
                            <span>{lomba}</span>
                            <Badge variant="outline" className="font-medium">{listPeserta.length} Peserta</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-3 px-4">
                        <ul className="space-y-1 list-decimal list-inside pl-2 text-sm text-slate-700">
                          {listPeserta.map((p, index) => (
                            <li key={`${lomba}-${index}`}>{p.data_peserta}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-slate-500 italic py-4 text-center">Tidak ada data peserta yang terinput untuk pendaftaran ini.</p>
              )}
            </div>
          </div>
        </ScrollArea>
         <div className="px-6 py-4 border-t flex justify-end sticky top-10 bg-white/95 backdrop-blur-sm z-10 rounded-b-lg">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}