import { motion } from 'framer-motion';
import { Calendar, ImageIcon, MapPin, Tag } from 'lucide-react';

const urgencyConfig = {
  Low: {
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
  },
  Medium: {
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
  },
  High: {
    badge: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20',
    dot: 'bg-red-500',
  },
};

const statusConfig = {
  Open: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20',
  'In Progress':
    'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-400/20',
  Resolved:
    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-400/20',
};

const STATUSES = ['Open', 'In Progress', 'Resolved'];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function TicketCard({
  issue,
  viewMode = 'grid',
  onStatusChange,
  onImageClick,
}) {
  const urgency = urgencyConfig[issue.urgency] || urgencyConfig.Low;

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        whileHover={{ x: 2 }}
        className="group rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Photo thumbnail (list) */}
          {issue.photo_url && (
            <button
              onClick={() => onImageClick(issue.photo_url)}
              className="relative shrink-0 w-full sm:w-16 h-24 sm:h-16 rounded-xl overflow-hidden group/img"
            >
              <img
                src={issue.photo_url}
                alt="Issue"
                className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <ImageIcon
                  size={16}
                  className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-200"
                />
              </div>
            </button>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {issue.ticket_number}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${urgency.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                {issue.urgency}
              </span>
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusConfig[issue.status] || ''}`}
              >
                {issue.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {issue.property_name}
              </span>
              <span className="inline-flex items-center gap-1">
                <Tag size={12} />
                {issue.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {issue.created_at
                  ? new Date(issue.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-1">
              {issue.description}
            </p>
          </div>

          {/* Status select */}
          <div className="shrink-0">
            <select
              value={issue.status}
              onChange={(e) => onStatusChange(issue.id, e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="group rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Photo banner */}
      {issue.photo_url && (
        <button
          onClick={() => onImageClick(issue.photo_url)}
          className="relative overflow-hidden rounded-t-2xl w-full h-36 group/img"
        >
          <img
            src={issue.photo_url}
            alt="Issue"
            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <ImageIcon size={16} className="text-slate-700 dark:text-white" />
            </div>
          </div>
        </button>
      )}

      {/* Card body */}
      <div className={`flex-1 p-5 sm:p-6 flex flex-col ${issue.photo_url ? '' : 'rounded-t-2xl'}`}>
        {/* Ticket + urgency header */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {issue.ticket_number}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${urgency.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
            {issue.urgency}
          </span>
        </div>

        {/* Property & category */}
        <div className="mb-3 space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug flex items-center gap-1.5">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            {issue.property_name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pl-[1.15rem]">
            <Tag size={11} className="shrink-0" />
            {issue.category}
          </p>
        </div>

        {/* Description */}
        <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-4 flex-1">
          {issue.description}
        </p>

        {/* Divider + footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Calendar size={13} />
            <span>
              {issue.created_at
                ? new Date(issue.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusConfig[issue.status] || ''}`}
            >
              {issue.status}
            </span>
            <select
              value={issue.status}
              onChange={(e) => onStatusChange(issue.id, e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
