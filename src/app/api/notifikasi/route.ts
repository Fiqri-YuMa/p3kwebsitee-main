// app/api/notifikasi/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Gunakan service role key
);

export async function POST(req: Request) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // --- BARU: Tentukan URL Halaman Statistik ---
    // Ganti 'https://nama-domain-anda.com' dengan URL aplikasi Anda yang sebenarnya.
    // Atau gunakan environment variable: process.env.NEXT_PUBLIC_BASE_URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://p3k2025.vercel.app/admin/statistik';
    const statistikUrl = `${baseUrl}`; // Asumsi halaman statistik ada di /statistik

    let body; // Definisikan body di luar try-catch agar bisa diakses di catch

    try {
        body = await req.json(); // Simpan body ke variabel
        const { namaSekolah, pembina, whatsapp, buktiUrl, namaPengirim } = body;

        const adminPhone = "6285603105234";
        const apiKey = "6705715";

        // --- Diperbarui: Tambahkan Link Statistik ke Pesan ---
        const pesan = `📢 *Pendaftar Baru!*\n\n` +
            `🏫 *${namaSekolah}*\n` +
            `👤 Pembina: ${pembina}\n` +
            `📱 WA: ${whatsapp}\n` +
            `📎 Bukti: ${buktiUrl}\n` +
            `👤 Nama Pengirim: ${namaPengirim}\n\n` +
            `📊 *Lihat Statistik Terbaru:*\n` + // <-- Baris Baru
            `${statistikUrl}\n\n` +            // <-- Baris Baru (Link)
            `Harap verifikasi pembayaran.`;

        const result = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodeURIComponent(pesan)}&apikey=${apiKey}`, {
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!result.ok) {
            // Fallback ke Supabase jika gagal
            await supabase.from('notifikasi_gagal').insert([{
                nama_sekolah: namaSekolah,
                pembina,
                whatsapp,
                bukti_url: buktiUrl,
                nama_pengirim: namaPengirim,
            }]);
            return NextResponse.json({ fallback: true, message: 'Notifikasi gagal dikirim. Disimpan ke fallback.' }, { status: 200 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API NOTIFIKASI ERROR', err);
        try {
            // Jika body belum ter-parse (error terjadi sebelum req.json()), coba parse lagi
            if (!body) {
                // Perhatian: req.json() hanya bisa dibaca sekali. Jika error terjadi
                // *setelah* req.json() berhasil, kita tidak bisa membacanya lagi.
                // Pendekatan yang lebih aman adalah memastikan body sudah ada.
                // Jika error terjadi *sebelum* req.json(), maka fallback mungkin tidak
                // mendapatkan data. Namun, untuk kasus umum, kita coba simpan jika body ada.
                 console.warn("Request body might not be available for fallback due to error timing.");
            }

            // Hanya coba insert jika body berhasil di-parse sebelumnya
            if (body) {
                await supabase.from('notifikasi_gagal').insert([{
                    nama_sekolah: body.namaSekolah,
                    pembina: body.pembina,
                    whatsapp: body.whatsapp,
                    bukti_url: body.buktiUrl,
                    nama_pengirim: body.namaPengirim,
                }]);
                 return NextResponse.json({ error: 'Gagal fetch CallMeBot, fallback disimpan' }, { status: 200 });
            } else {
                 return NextResponse.json({ error: 'Gagal fetch CallMeBot, fallback gagal (no body)' }, { status: 500 });
            }

        } catch (e) {
            console.error('Fallback Supabase insert error:', e);
            return NextResponse.json({ error: 'Gagal fetch CallMeBot, fallback juga gagal' }, { status: 500 }); // Beri status 500 jika fallback gagal
        }
    }
}