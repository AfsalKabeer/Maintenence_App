import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import Home from './pages/Home';
import Submit from './pages/Submit';
import Dashboard from './pages/Dashboard';

export default function App() {
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-white',
          duration: 3000,
        }}
      />

      {/* Dark mode toggle */}
      <button
        onClick={() => setDark(!dark)}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg border border-white/20 dark:border-slate-700/50 hover:scale-110 transition-transform"
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
      </button>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
