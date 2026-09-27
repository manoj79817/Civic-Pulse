import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import HomePage from './pages/HomePage.tsx';
import LiveMapPage from './pages/LiveMapPage.tsx';
import TrackIssuePage from './pages/TrackIssuePage.tsx';
import OpsCenterPage from './pages/OpsCenterPage.tsx';
import AnalyticsPage from './pages/AnalyticsPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/track" element={<TrackIssuePage />} />
            <Route path="/track/:trackingId" element={<TrackIssuePage />} />
            <Route path="/ops" element={<OpsCenterPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
