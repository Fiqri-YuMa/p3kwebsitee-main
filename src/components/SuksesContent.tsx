'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function SuksesContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const kode_unit = searchParams?.get('kode_unit') ?? '';
  const nama_sekolah = searchParams?.get('nama_sekolah') ?? '';
  const nama_pengirim = searchParams?.get('nama_pengirim') ?? '';
  const whatsapp = searchParams?.get('whatsapp') ?? '';
  const kategori = searchParams?.get('kategori') ?? '';
  const total = searchParams?.get('total') ?? '';

  const rincian: { nama: string; jumlah: number; biaya: number }[] = [];
  searchParams?.forEach((value, key) => {
    const exclude = [
      'kode_unit',
      'nama_sekolah',
      'nama_pengirim',
      'whatsapp',
      'kategori',
      'total',
    ];
    if (!exclude.includes(key)) {
      const jumlah = parseInt(value || '0');
      const biaya = 20000;
      if (jumlah > 0) {
        rincian.push({ nama: key, jumlah, biaya });
      }
    }
  });

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pdfgen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode_unit,
          nama_sekolah,
          nama_pengirim,
          whatsapp,
          kategori,
          total,
          rincian,
        }),
      });

      if (!response.ok) throw new Error('Gagal membuat PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kwitansi_${nama_sekolah}_${kode_unit}.pdf`;
      link.click();
    } catch (error) {
      console.error('❌ Gagal mengunduh kwitansi:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-12 pt-28">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold text-green-700">Pendaftaran Berhasil!</h1>
          <p className="text-sky-600">
            Data Anda telah tersimpan. Silakan unduh kwitansi sebagai bukti pendaftaran.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-sky-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-sky-700">Kode Unit</p>
              <p>{kode_unit}</p>
            </div>
            <div>
              <p className="font-semibold text-sky-700">Nama Sekolah</p>
              <p>{nama_sekolah}</p>
            </div>
            <div>
              <p className="font-semibold text-sky-700">Nama Pengirim</p>
              <p>{nama_pengirim}</p>
            </div>
            <div>
              <p className="font-semibold text-sky-700">WhatsApp</p>
              <p>{whatsapp}</p>
            </div>
            <div>
              <p className="font-semibold text-sky-700">Kategori</p>
              <p>{kategori}</p>
            </div>
            <div>
              <p className="font-semibold text-sky-700">Total Bayar</p>
              <p>Rp {parseInt(total || '0').toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow transition"
          >
            {loading ? 'Memproses...' : 'Unduh Kwitansi'}
          </button>
        </div>

        <div className="text-center text-sm text-sky-600 space-y-2">
          <p>✉️ Kwitansi akan dikirim juga melalui WhatsApp yang terdaftar</p>
          <p>📞 Hubungi panitia jika ada pertanyaan atau kendala teknis</p>
        </div>
      </div>
    </div>
  );
}
