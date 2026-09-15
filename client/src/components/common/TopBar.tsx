import React from 'react';
import { Phone, Mail, Facebook, Instagram, Youtube, HelpCircle } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <div className="bg-kimdong-red text-white text-xs py-1.5 px-4 border-b border-red-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Side: Hotline & Email */}
        <div className="flex items-center gap-6">
          <a href="tel:1900571595" className="flex items-center gap-1.5 hover:text-red-200 transition-colors">
            <Phone className="w-3.5 h-3.5" />
            <span className="font-semibold">Hotline: 1900 571 595</span>
          </a>
          <a href="mailto:info@nxbkimdong.com.vn" className="hidden sm:flex items-center gap-1.5 hover:text-red-200 transition-colors">
            <Mail className="w-3.5 h-3.5" />
            <span>info@nxbkimdong.com.vn</span>
          </a>
        </div>

        {/* Right Side: Social Media & System info */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 border-r border-red-500 pr-4">
            <span className="text-red-100">Kết nối:</span>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-red-200 transition-colors p-1" title="Facebook">
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-red-200 transition-colors p-1" title="Instagram">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-red-200 transition-colors p-1" title="YouTube">
              <Youtube className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/about" className="hover:text-red-200 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hệ thống nhà sách</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
