// hooks/usePendaftar.ts
import { useState, useEffect } from "react";
import { Pendaftar } from "@/types/Pendaftar"; // Sesuaikan dengan tipe data yang kamu miliki
import { supabase } from '@/lib/supabase';

export function usePendaftar() {
    const [data, setData] = useState<Pendaftar[]>([]);
    const [loading, setLoading] = useState(true);
  
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pendaftaran")
        .select("*")
        .order("created_at", { ascending: false });
  
      if (!error && data) setData(data as Pendaftar[]);
      setLoading(false);
      
    };
  
    useEffect(() => {
      fetchData();
  
      const interval = setInterval(() => {
        fetchData();
      }, 30000); // 30 detik
  
      return () => clearInterval(interval); // bersihkan interval saat unmount
    }, []);
  
    return { data, loading, refetch: fetchData };
  }