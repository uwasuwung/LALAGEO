/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/pages/HomePage';
import { InteractiveMap } from './components/map/InteractiveMap';
import { CatalogPage } from './components/pages/CatalogPage';
import { RegionsPage } from './components/pages/RegionsPage';
import { AboutPage } from './components/pages/AboutPage';
import { AdminPage } from './components/pages/AdminPage';
import { LoginModal } from './components/auth/LoginModal';
import { store } from './services/store';
import { User, AdministrativeRegion } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(() => store.getCurrentUser());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [focusedDatasetId, setFocusedDatasetId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
    return unsub;
  }, []);

  const handleNavigate = (tab: string, datasetId?: string) => {
    setCurrentTab(tab);
    if (datasetId) {
      setFocusedDatasetId(datasetId);
    }
    // Scroll to top when changing page (except map)
    if (tab !== 'map') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenMapWithDataset = (datasetId: string) => {
    setFocusedDatasetId(datasetId);
    setCurrentTab('map');
  };

  const handleZoomToRegion = (region: AdministrativeRegion) => {
    setCurrentTab('map');
    // Allow InteractiveMap to mount, then center
    setTimeout(() => {
      setFocusedDatasetId('ds-big-01'); // Ensure administrative boundary is visible
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1E293B]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => store.logout()}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage onNavigate={handleNavigate} />
        )}

        {currentTab === 'map' && (
          <InteractiveMap
            initialDatasetId={focusedDatasetId}
            onClearInitialDataset={() => setFocusedDatasetId(null)}
            onNavigateToCatalog={() => setCurrentTab('catalog')}
          />
        )}

        {currentTab === 'catalog' && (
          <CatalogPage onOpenMapWithDataset={handleOpenMapWithDataset} />
        )}

        {currentTab === 'regions' && (
          <RegionsPage onZoomToRegion={handleZoomToRegion} />
        )}

        {currentTab === 'about' && (
          <AboutPage />
        )}

        {currentTab === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* Footer (Rendered on all pages except full-screen interactive GIS map) */}
      {currentTab !== 'map' && <Footer onNavigate={handleNavigate} />}

      {/* Auth Modal */}
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}
