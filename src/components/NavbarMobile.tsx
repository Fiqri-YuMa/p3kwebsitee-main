'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Home, FileText, UserPlus, Trophy, Info, Menu, ArrowRight, ExternalLink } from 'lucide-react'; // Impor ikon baru

// Varian animasi untuk menu (slide-in/out)
const menuVariants = {
  open: { 
    x: 0, 
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 } 
  },
  closed: { 
    x: '100%', 
    transition: { type: 'spring', stiffness: 400, damping: 35 } 
  },
};

// Varian animasi untuk container list (stagger)
const listVariants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 }
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
};

// Varian animasi untuk item list (fade/slide up)
const itemVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: { y: { stiffness: 1000, velocity: -100 } }
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: { y: { stiffness: 1000 } }
  }
};

export default function NavbarMobile() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Daftar path admin yang harus menyembunyikan navbar
  const adminPaths = [
    '/admin'
  ];

  const isAdminPage = pathname && adminPaths.some(adminPath => 
    pathname.startsWith(adminPath)
  );

  // Menutup menu saat path berubah
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Mencegah scroll saat menu terbuka
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'auto';
    return () => {
        document.body.style.overflow = 'auto'; // Cleanup
    };
  }, [open]);

  if (isAdminPage) return null;

  const navItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/informasi', label: 'Informasi Lomba', icon: Info },
    { href: '/admin/leaderboard', label: 'Hasil Akhir Lomba', icon: Trophy },
    {
      href: 'https://drive.google.com/drive/folders/1HAsBXoPitXxJXpGss1smselXrWCHH5Jo?usp=sharing',
      label: 'Surat Edaran',
      external: true,
      icon: FileText
    },
  ];

  return (
    <nav className="md:hidden fixed top-0 left-0 w-full z-[100]"> {/* Z-index tinggi */}
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white/85 backdrop-blur-md px-4 h-20 shadow-sm border-b border-gray-100/50">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image 
            src="/desain-p3k.png" 
            alt="Logo P3K" 
            width={120} // Sedikit lebih besar
            height={45} 
            className="object-contain"
            priority
          />
        </Link>
        
        <motion.button 
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full text-sky-600 hover:bg-sky-50 transition-colors z-50" // Z-index agar di atas overlay
          aria-label="Toggle menu"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
            <Menu className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Overlay Menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Background Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />

            {/* Slide-in Menu */}
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 h-screen w-[85%] max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex flex-col h-full p-6 pt-8">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
                  <Image 
                    src="/desain-p3k.png" 
                    alt="Logo P3K" 
                    width={130} 
                    height={50} 
                    className="object-contain"
                  />
                  <motion.button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    aria-label="Tutup menu"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {/* Navigation Items */}
                <motion.nav 
                  className="flex-1 flex flex-col gap-3"
                  variants={listVariants}
                >
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <motion.div key={item.href} variants={itemVariants}>
                          <Link
                            href={item.href}
                            target={item.external ? '_blank' : undefined}
                            rel={item.external ? 'noopener noreferrer' : undefined}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-4 p-4 rounded-xl text-base font-medium transition-all duration-200 group
                            ${
                              isActive 
                                ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100' // Styling aktif lebih jelas
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <div className={`p-1.5 rounded-md ${isActive ? 'bg-sky-100' : 'bg-gray-100 group-hover:bg-white'}`}>
                               <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-gray-500 group-hover:text-sky-600'}`} />
                            </div>
                            <span>{item.label}</span>
                            {item.external && <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />}
                          </Link>
                      </motion.div>
                    );
                  })}
                </motion.nav>

                {/* CTA Section */}
                <motion.div 
                    className="border-t border-gray-100 pt-6 mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } }}
                    exit={{ opacity: 0 }}
                >
                  <Link
                    href="/daftar"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-center gap-3 w-full 
                               bg-gradient-to-r from-sky-500 to-cyan-500 
                               text-white py-3.5 px-6 rounded-full font-bold 
                               hover:shadow-xl hover:shadow-sky-500/30 
                               transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>DAFTAR SEKARANG</span>
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}