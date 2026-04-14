
'use client';

import { usePathname } from 'next/navigation';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';

export default function FloatingButtons() {
    const pathname = usePathname(); 

 
    const adminPrefix = '/admin';

   
    if (!pathname) {
        return null;
    }

    
    const isAdminPage = pathname.startsWith(adminPrefix);

    
    if (isAdminPage) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            <a
                href="https://wa.me/6283177642773"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition"
                title="Kontak WhatsApp"
            >
                <FaWhatsapp className="w-6 h-6" />
            </a>

            <a
                href="https://www.instagram.com/ksrpmiunitunsur_/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-500 text-white p-3 rounded-full shadow-lg hover:bg-pink-600 transition"
                title="Instagram"
            >
                <FaInstagram className="w-6 h-6" />
            </a>
        </div>
    );
}