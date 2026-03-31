import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, LayoutDashboard, Wrench } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
    >
      {/* Header */}
      <motion.div variants={container} initial="hidden" animate="show" className="text-center mb-12">
        <motion.div variants={item} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl mb-6">
          <Wrench size={36} className="text-white" />
        </motion.div>
        <motion.h1 variants={item} className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
          Maintenance Logger
        </motion.h1>
        <motion.p variants={item} className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
          Track, manage, and resolve maintenance issues across all your properties.
        </motion.p>
      </motion.div>

      {/* Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <motion.div variants={item}>
          <Link to="/submit">
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl p-8 cursor-pointer transition-shadow hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 group-hover:from-blue-500/10 group-hover:to-indigo-500/20 transition-all" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
                  <ClipboardList size={26} className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Submit an Issue</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Report a new maintenance issue with details, photos, and urgency level.</p>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link to="/dashboard">
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl p-8 cursor-pointer transition-shadow hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 group-hover:from-emerald-500/10 group-hover:to-teal-500/20 transition-all" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg group-hover:shadow-emerald-500/25 transition-shadow">
                  <LayoutDashboard size={26} className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Issue Dashboard</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">View, filter, and manage all reported maintenance issues in one place.</p>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
