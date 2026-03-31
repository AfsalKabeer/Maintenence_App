import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Inbox,
  RefreshCw,
  LayoutGrid,
  List,
  Filter,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import TicketCard from './TicketCard';
import ImageModal from './ImageModal';

const PROPERTIES = [
  'All',
  'Sunrise Apartments',
  'Oakwood Residences',
  'Maple Heights',
  'Riverview Complex',
  'Cedar Park Towers',
];
const URGENCIES = ['All', 'Low', 'Medium', 'High'];

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-3/4 rounded-md bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-1/2 rounded-md bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 p-5 group hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function IssueDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [modalImage, setModalImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchIssues(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('maintenance_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (err) {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchIssues();
  }, []);

  async function updateStatus(id, status) {
    try {
      const { error } = await supabase
        .from('maintenance_issues')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setIssues((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  }

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (filterProperty !== 'All' && issue.property_name !== filterProperty)
        return false;
      if (filterUrgency !== 'All' && issue.urgency !== filterUrgency)
        return false;
      if (
        searchTerm &&
        !issue.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  }, [issues, filterProperty, filterUrgency, searchTerm]);

  const stats = useMemo(() => {
    const open = issues.filter((i) => i.status === 'Open').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;
    const high = issues.filter((i) => i.urgency === 'High').length;
    return { open, inProgress, resolved, high };
  }, [issues]);

  function exportCSV() {
    if (filtered.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Ticket #',
      'Property',
      'Category',
      'Urgency',
      'Description',
      'Status',
      'Created At',
    ];
    const rows = filtered.map((i) => [
      i.ticket_number,
      i.property_name,
      i.category,
      i.urgency,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      i.status,
      new Date(i.created_at).toLocaleString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maintenance_issues_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  }

  const hasActiveFilters =
    searchTerm || filterProperty !== 'All' || filterUrgency !== 'All';

  function clearFilters() {
    setSearchTerm('');
    setFilterProperty('All');
    setFilterUrgency('All');
  }

  return (
    <>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-6 lg:space-y-8"
      >
        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Issue Dashboard
            </h1>
            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              {loading
                ? 'Loading issues…'
                : `Showing ${filtered.length} of ${issues.length} total issues`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchIssues(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-[0.97] transition-all duration-200 text-sm font-medium shadow-sm"
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97] transition-all duration-200"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={BarChart3}
              label="Total Issues"
              value={issues.length}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              delay={0}
            />
            <StatCard
              icon={Clock}
              label="Open"
              value={stats.open}
              color="bg-gradient-to-br from-amber-400 to-orange-500"
              delay={0.05}
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={stats.resolved}
              color="bg-gradient-to-br from-emerald-400 to-emerald-600"
              delay={0.1}
            />
            <StatCard
              icon={AlertTriangle}
              label="High Urgency"
              value={stats.high}
              color="bg-gradient-to-br from-rose-400 to-red-600"
              delay={0.15}
            />
          </div>
        )}

        {/* ── Filters toolbar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 p-4 sm:p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            {/* Top row: filter label + view toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Filter size={15} className="text-slate-400" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900/60">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative group">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200"
                />
                <input
                  type="text"
                  placeholder="Search by ticket #…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              <div className="relative">
                <select
                  value={filterProperty}
                  onChange={(e) => setFilterProperty(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                >
                  {PROPERTIES.map((p) => (
                    <option key={p} value={p}>
                      {p === 'All' ? 'All Properties' : p}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              <div className="relative">
                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200"
                >
                  {URGENCIES.map((u) => (
                    <option key={u} value={u}>
                      {u === 'All' ? 'All Urgencies' : u}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Content area ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-24 sm:py-32 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-5 shadow-inner">
                <Inbox size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                No issues found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
                {hasActiveFilters
                  ? 'No results match your current filters. Try adjusting or clearing them.'
                  : 'Submit your first maintenance issue to get started.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } },
              }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5'
                  : 'flex flex-col gap-3 sm:gap-4'
              }
            >
              {filtered.map((issue) => (
                <TicketCard
                  key={issue.id}
                  issue={issue}
                  viewMode={viewMode}
                  onStatusChange={updateStatus}
                  onImageClick={setModalImage}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
    </>
  );
}
