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
    // 🔹 Ambil data pendaftaran
    const { data: pendaftaran, error } = await supabase
      .from('pendaftaran')
      .select('*')
      .eq('nomor', nomor)
      .single();

    if (error || !pendaftaran) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // 🔹 Ambil data lomba dari JSON
    const lombaData = pendaftaran.lombaJson || {};

    // 🔹 Load gambar (aman)
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
    let y = margin;
    const pageWidth = doc.internal.pageSize.getWidth();

    // 🔹 Header
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, y, 40, 25);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PEKAN PERLOMBAAN PMR (P3K) 2026', margin + 50, y + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('KSR PMI Unit Universitas Suryakancana', margin + 50, y + 14);
    doc.text('Cianjur, Jawa Barat', margin + 50, y + 20);

    y += 30;
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // 🔹 Judul
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('BUKTI PEMBAYARAN RESMI', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // 🔹 Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Nomor: ${nomor}`, margin, y);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, margin, y + 5);

    doc.text(`Sekolah: ${pendaftaran.nama_sekolah}`, margin, y + 15);
    doc.text(`Pembina: ${pendaftaran.pembina}`, margin, y + 20);
    doc.text(`WA: ${pendaftaran.whatsapp}`, margin, y + 25);

    y += 35;

    // 🔹 Table Header
    const headers = ['Nama Lomba', 'Jumlah', 'Biaya'];
    const colWidths = [90, 30, 50];
    const rowHeight = 8;

    let x = margin;

    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], rowHeight);
      doc.text(h, x + 2, y + 5);
      x += colWidths[i];
    });

    y += rowHeight;

    // 🔹 Table Rows (FIXED pakai lombaJson)
    doc.setFont('helvetica', 'normal');

    const rows = LOMBA_LIST
      .filter(l => (lombaData[l.id] || 0) > 0)
      .map(l => [
        l.nama,
        (lombaData[l.id] || 0).toString(),
        `Rp ${(l.biaya * (lombaData[l.id] || 0)).toLocaleString('id-ID')}`
      ]);

    rows.forEach(row => {
      x = margin;
      row.forEach((cell, i) => {
        doc.rect(x, y, colWidths[i], rowHeight);
        doc.text(cell, x + 2, y + 5);
        x += colWidths[i];
      });
      y += rowHeight;
    });

    y += 10;

    // 🔹 Total (FIXED)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(
      `Total: Rp ${pendaftaran.totalBayar.toLocaleString('id-ID')}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );

    y += 20;

    // 🔹 Stempel
    if (stempelBase64) {
      doc.addImage(stempelBase64, 'PNG', pageWidth - 80, y - 10, 60, 60);
    }

    doc.text('Panitia P3K 2026', pageWidth - 50, y + 50, { align: 'center' });

    // 🔹 Convert PDF
    const pdfBuffer = doc.output('arraybuffer');
    const filename = `kwitansi/${nomor}.pdf`;

    // 🔹 Upload ke Supabase Storage
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

    // 🔹 Update DB
    await supabase
      .from('pendaftaran')
      .update({ kwitansi_url: urlData.publicUrl })
      .eq('nomor', nomor);
    
      

    return NextResponse.json({
      success: true,
      kwitansi_url: urlData.publicUrl
    });

  } catch (err: any) {
    console.error('API ERROR:', err);

    return NextResponse.json({
      error: 'Gagal membuat kwitansi',
      detail: err.message
    }, { status: 500 });
  }
}