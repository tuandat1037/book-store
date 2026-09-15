import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from '../components/common/TopBar';
import { Header } from '../components/common/Header';
import { Navigation } from '../components/common/Navigation';
import { Footer } from '../components/common/Footer';

export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <TopBar />
      <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />
      <Navigation
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
