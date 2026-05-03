import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { LOMBA_LIST } from '@/data/lomba';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nomor = searchParams.get('nomor');

  if (!nomor) {
    return NextResponse.json({ error: 'Nomor is required' }, { status: 400 });
  }

  try {
    // Ambil data pendaftaran
    const { data: pendaftaran, error } = await supabase
      .from('pendaftaran')
      .select('*')
      .eq('nomor', nomor)
      .single();

    if (error || !pendaftaran) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // Parse lombaJson dari Supabase
    const rawLombaJson =
      pendaftaran.lombaJson ||
      pendaftaran.lomba_json ||
      pendaftaran.lomba ||
      '{}';

    let lombaData: Record<string, any> = {};

    try {
      if (typeof rawLombaJson === 'string') {
        lombaData = JSON.parse(rawLombaJson || '{}');
      } else if (typeof rawLombaJson === 'object' && rawLombaJson !== null) {
        lombaData = rawLombaJson;
      }
    } catch (e) {
      console.error('Gagal parse lombaJson:', rawLombaJson, e);
      lombaData = {};
    }

    // Bikin rows tabel lomba
    const rows = LOMBA_LIST
      .map((lomba) => {
        const jumlah = Number(lombaData[lomba.id] || 0);

        if (jumlah <= 0) return null;

        const biaya = Number(lomba.biaya) * jumlah;

        return {
          nama: lomba.nama,
          jumlah,
          biaya,
        };
      })
      .filter((row): row is { nama: string; jumlah: number; biaya: number } => row !== null);

    console.log('RAW LOMBA JSON:', rawLombaJson);
    console.log('PARSED LOMBA DATA:', lombaData);
    console.log('ROWS PDF:', rows);

    // Load gambar
    let logoBase64 = '';
    let stempelBase64 = '';

    try {
      const logoPath = path.join(process.cwd(), 'public', 'desain-p3k.png');
      const stempelPath = path.join(process.cwd(), 'public', 'Picture1.png');

      logoBase64 = fs.readFileSync(logoPath).toString('base64');
      stempelBase64 = fs.readFileSync(stempelPath).toString('base64');
    } catch (e) {
      console.warn('Gagal load gambar:', e);
    }

    const doc = new jsPDF('p', 'mm', 'a4');

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    let y = margin;

    // Header
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, y, 40, 25);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PEKAN PERLOMBAAN PMR (P3K) 2026', margin + 50, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('KSR PMI Unit Universitas Suryakancana', margin + 50, y + 14);
    doc.text('Cianjur, Jawa Barat', margin + 50, y + 20);

    y += 30;

    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Judul
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('BUKTI PEMBAYARAN RESMI', pageWidth / 2, y, { align: 'center' });

    y += 10;

    // Info peserta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text(`Nomor: ${nomor}`, margin, y);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, margin, y + 5);

    doc.text(`Sekolah: ${pendaftaran.nama_sekolah || '-'}`, margin, y + 15);
    doc.text(`Pembina: ${pendaftaran.pembina || '-'}`, margin, y + 20);
    doc.text(`WA: ${pendaftaran.whatsapp || '-'}`, margin, y + 25);

    y += 35;

    // Tabel lomba
    const colNama = 90;
    const colJumlah = 30;
    const colBiaya = 50;
    const rowHeight = 8;

    let x = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    // Header tabel
    doc.rect(x, y, colNama, rowHeight);
    doc.text('Nama Lomba', x + 2, y + 5);
    x += colNama;

    doc.rect(x, y, colJumlah, rowHeight);
    doc.text('Jumlah', x + 2, y + 5);
    x += colJumlah;

    doc.rect(x, y, colBiaya, rowHeight);
    doc.text('Biaya', x + 2, y + 5);

    y += rowHeight;

    // Isi tabel
    doc.setFont('helvetica', 'normal');

    if (rows.length === 0) {
      x = margin;
      doc.rect(x, y, colNama + colJumlah + colBiaya, rowHeight);
      doc.text('Tidak ada data lomba', x + 2, y + 5);
      y += rowHeight;
    } else {
      rows.forEach((row) => {
        x = margin;

        doc.rect(x, y, colNama, rowHeight);
        doc.text(row.nama, x + 2, y + 5);
        x += colNama;

        doc.rect(x, y, colJumlah, rowHeight);
        doc.text(String(row.jumlah), x + 2, y + 5);
        x += colJumlah;

        doc.rect(x, y, colBiaya, rowHeight);
        doc.text(`Rp ${row.biaya.toLocaleString('id-ID')}`, x + 2, y + 5);

        y += rowHeight;
      });
    }

    y += 10;

    // Total
    const totalBayar = Number(
      pendaftaran.totalBayar ||
      pendaftaran.total_bayar ||
      0
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(
      `Total: Rp ${totalBayar.toLocaleString('id-ID')}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );

    y += 20;

    // Stempel
    if (stempelBase64) {
      doc.addImage(stempelBase64, 'PNG', pageWidth - 80, y - 10, 60, 60);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Panitia P3K 2026', pageWidth - 50, y + 50, { align: 'center' });

    // Convert PDF
    const pdfBuffer = doc.output('arraybuffer');

    // Pakai nama baru biar gak kena cache PDF lama
    const filename = `kwitansi/${nomor}-${Date.now()}.pdf`;

    // Upload ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('kwitansi')
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from('kwitansi')
      .getPublicUrl(filename);

    // Update DB
    await supabase
      .from('pendaftaran')
      .update({ kwitansi_url: urlData.publicUrl })
      .eq('nomor', nomor);

    return NextResponse.json({
      success: true,
      kwitansi_url: urlData.publicUrl,
    });
  } catch (err: any) {
    console.error('API ERROR:', err);

    return NextResponse.json(
      {
        error: 'Gagal membuat kwitansi',
        detail: err.message,
      },
      { status: 500 }
    );
  }
}