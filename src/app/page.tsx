'use client';

import { motion, type Variants } from 'framer-motion';
// Impor useMemo dan useRef
import { useEffect, useState, useMemo, useRef } from 'react'; 
import { Button } from '@/components/ui/button';
import { Info, Sunrise, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// --- Interfaces & Types ---
interface TimeLeftState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
}

// --- Varian Animasi ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 80, damping: 20 },
  },
};

// --- Fungsi Helper ---
function calculateTimeLeft(eventDate: Date): TimeLeftState {
    const now = new Date().getTime();
    const distance = eventDate.getTime() - now;
    if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / (1000 * 60)) % 60),
        seconds: Math.floor((distance / 1000) % 60),
        ended: false,
    };
}

// --- Komponen Background ---
const HorizonGlow = () => { 
    return (
        <motion.div
            className="absolute -bottom-1/3 left-0 right-0 h-1/2 
                       bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] 
                       from-sky-200/20 via-cyan-500/10 to-transparent 
                       pointer-events-none z-1 filter blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
};
const GoldenLightMotes = ({ count = 70 }) => { 
    const [motes, setMotes] = useState<any[]>([]);
    useEffect(() => {
        setMotes(Array.from({ length: count }).map(() => ({
            x: `${Math.random() * 100}vw`, y: `${Math.random() * 100}vh`,
            size: `${Math.random() * 2 + 0.5}px`, duration: 50 + Math.random() * 50,
            delay: Math.random() * 50, directionX: (Math.random() - 0.5) * 40,
            directionY: (Math.random() - 0.5) * 40,
        })));
    }, [count]);
    return (
        <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
            {motes.map((p, i) => (
                <motion.div
                    key={`mote-${i}`} className="absolute rounded-full bg-cyan-300/50"
                    style={{ top: p.y, left: p.x, width: p.size, height: p.size, boxShadow: '0 0 5px 0px rgba(56, 189, 248, 0.5)' }}
                    animate={{ x: [0, p.directionX, -p.directionX, 0], y: [0, p.directionY, p.directionY / 2, 0], opacity: [0, 0.6, 0.6, 0] }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut", opacity: { times: [0, 0.2, 0.8, 1] } }}
                />
            ))}
        </div>
    );
};

// --- Komponen Utama (Homepage) ---
export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Gunakan useMemo untuk membuat eventDate stabil
  const eventDate = useMemo(() => new Date('2026-06-19T00:00:00'), []); 
  
  const [timeLeft, setTimeLeft] = useState<TimeLeftState>(calculateTimeLeft(eventDate));
  
  // Tambahkan useRef (meski tidak digunakan di sini, seringkali berguna dan baik untuk ada jika diperlukan)
  const targetRef = useRef<HTMLDivElement>(null);

  // Perbarui useEffect dengan dependency array yang benar
  useEffect(() => { 
      setIsMounted(true); 
      
      const timer = setInterval(() => {
          setTimeLeft(calculateTimeLeft(eventDate));
      }, 1000); 
      
      return () => clearInterval(timer); 
  // Tambahkan eventDate ke dependency array.
  }, [eventDate]); 

  return (
    // Gunakan ref jika diperlukan
    <div ref={targetRef} className="relative min-h-screen overflow-hidden bg-gradient-to-b from-cyan-800 via-black-300 to-blue-200 text-slate-900">
        
        {isMounted && (
            <>
                <HorizonGlow />   {/* z-1 */}
                <GoldenLightMotes />  {/* z-2 */}
            </>
        )}

      <div className="relative z-10 container mx-auto px-6 md:px-8 py-24 md:py-32 min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-5 items-center justify-between gap-16 lg:gap-12 w-full">
          
          <motion.div 
            className="text-center lg:text-left lg:col-span-3"
            variants={containerVariants} initial="hidden" animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-5">
              <span className="inline-flex items-center gap-2 text-xs md:text-sm font-medium 
                               border border-sky-500/50 text-sky-300/80
                               px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                <Trophy className="w-4 h-4" />
                MEMPEREBUTKAN PIALA GUBERNUR JAWA BARAT 
              </span>
            </motion.div>

            <motion.h1 
                variants={itemVariants} 
                className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-300 via-cyan-500 to-blue-500 bg-clip-text text-transparent leading-tight mb-6 tracking-tight drop-shadow-lg"
            >
                P3K UNSUR 2026 <br/>
                <span className="bg-gradient-to-r from-sky-400 to-blue-300 bg-clip-text text-transparent">
                  &quot;SIAGA, Solidaritas dan Inspiratif Aksi Generasi Peduli Lingkungan&quot;
                </span>
            </motion.h1>

            <motion.p 
                variants={itemVariants} 
                className="text-md md:text-lg text-slate-700 mb-12 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
                PEKAN PERLOMBAAN PMR KSR PMI UNIT UNIVERSITAS SURYAKANCANA TINGKAT
                WIRA DAN MADYA SE-WILAYAH PROVINSI JAWA BARAT TAHUN 2026.
            </motion.p>

            <motion.div 
                variants={itemVariants} 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg" 
                className="group w-full sm:w-auto h-14 px-10 rounded-lg 
                           bg-sky-500 text-white
                           text-base font-semibold shadow-lg shadow-sky-400/40 
                           hover:bg-sky-600 hover:shadow-xl hover:shadow-sky-500/50
                           transition-all duration-300 transform hover:scale-[1.03]"
                asChild
              >
                  <Link href="/daftar">
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="group w-full sm:w-auto h-14 px-10 rounded-lg 
                           border-sky-700/60 bg-white/10 backdrop-blur-sm
                           text-slate-800 hover:bg-white/20 hover:border-sky-400/60 
                           transition-all duration-300 font-medium"
                asChild
              >
                  <Link href="/informasi">
                    <Info className="w-5 h-5 mr-2" />
                    Informasi Lomba
                  </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
              className="w-full lg:col-span-2 
                         bg-black/30 backdrop-blur-xl rounded-2xl p-8 
                         border border-white/10 shadow-2xl shadow-black/30"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 80 }}
          >
            <h3 className="text-center text-lg font-semibold text-sky-300 mb-8 flex items-center justify-center gap-2 tracking-wider">
              <Sunrise className="w-5 h-5" />
              {timeLeft.ended ? "ACARA SEDANG BERLANGSUNG" : "HITUNG MUNDUR ACARA"}
            </h3>

            <div className="flex justify-around items-start text-stone-50 border-t border-b border-white/10 py-6">
              {Object.entries(timeLeft).filter(([unit]) => unit !== 'ended').map(([unit, value]) => (
                <div key={unit} className="text-center w-16">
                  <div className="text-5xl md:text-6xl font-thin 
                                  text-white mb-2 
                                  tabular-nums tracking-tighter">
                    {String(value).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-light text-sky-300 uppercase tracking-widest">
                    {unit}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-stone-50 mt-8 text-xs font-light tracking-wide">
              🗓️ 19 Juni 2026 | Universitas Suryakancana, Cianjur
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}