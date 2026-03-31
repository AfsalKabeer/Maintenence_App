import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabaseClient';

const PROPERTIES = [
  'Sunrise Apartments',
  'Oakwood Residences',
  'Maple Heights',
  'Riverview Complex',
  'Cedar Park Towers',
];

const CATEGORIES = ['Plumbing', 'Electrical', 'AC/HVAC', 'Furniture', 'Cleaning', 'Other'];
const URGENCIES = ['Low', 'Medium', 'High'];

const schema = z.object({
  property_name: z.string().min(1, 'Please select a property'),
  category: z.string().min(1, 'Please select a category'),
  urgency: z.string().min(1, 'Please select urgency level'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be under 500 characters'),
});

async function generateTicketNumber() {
  const { data } = await supabase
    .from('maintenance_issues')
    .select('ticket_number')
    .order('created_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const last = data[0].ticket_number;
    const num = parseInt(last.replace('MNT-', ''), 10) + 1;
    return `MNT-${String(num).padStart(4, '0')}`;
  }
  return 'MNT-0001';
}

async function uploadPhoto(file) {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('maintenance-photos')
    .upload(fileName, file, { contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from('maintenance-photos').getPublicUrl(fileName);
  return data.publicUrl;
}

export default function IssueForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const description = watch('description', '');

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  async function onSubmit(formData) {
    setSubmitting(true);
    try {
      const ticketNumber = await generateTicketNumber();
      let photoUrl = null;

      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      const { error } = await supabase.from('maintenance_issues').insert({
        ticket_number: ticketNumber,
        property_name: formData.property_name,
        category: formData.category,
        urgency: formData.urgency,
        description: formData.description,
        photo_url: photoUrl,
        status: 'Open',
      });

      if (error) throw error;

      setSubmitted({
        ticket_number: ticketNumber,
        ...formData,
        photo_url: photoUrl,
      });
      toast.success('Issue submitted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit issue');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSubmitted(null);
    setPhoto(null);
    setPhotoPreview(null);
    reset();
  }

  function downloadTicketPDF() {
    if (!submitted) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const urgencyHex = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
    const accent = '#4f46e5';

    // ── Background ──
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pw, ph, 'F');

    // ── Top accent band ──
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pw, 44, 'F');

    // Subtle gradient overlay on band
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pw / 2, 44, 'F');

    // ── Company header ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('MAINTENANCE ISSUE TICKET', 20, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(199, 210, 254);
    doc.text('Facility Management System  |  Official Service Request', 20, 28);

    // Ticket number badge (right side of header)
    const ticketBadgeW = 46;
    const ticketBadgeX = pw - ticketBadgeW - 16;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(ticketBadgeX, 10, ticketBadgeW, 24, 4, 4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TICKET NO.', ticketBadgeX + ticketBadgeW / 2, 18, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text(submitted.ticket_number, ticketBadgeX + ticketBadgeW / 2, 28, { align: 'center' });

    // ── Date / Time row ──
    let y = 56;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(16, y - 6, pw - 32, 18, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(16, y - 6, pw - 32, 18, 3, 3, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('DATE ISSUED', 24, y + 1);
    doc.text('TIME', pw / 2, y + 1);
    doc.text('STATUS', pw - 60, y + 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(dateStr, 24, y + 8);
    doc.text(timeStr, pw / 2, y + 8);

    // Status badge
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(pw - 60, y + 3, 30, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(37, 99, 235);
    doc.text('OPEN', pw - 60 + 15, y + 8, { align: 'center' });

    // ── Main content card ──
    y = 80;
    const cardX = 16;
    const cardW = pw - 32;
    const cardH = 120;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, y, cardW, cardH, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardW, cardH, 4, 4, 'S');

    // Card title
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('ISSUE DETAILS', cardX + 10, y);

    // Thin line separator
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(cardX + 10, y, cardX + cardW - 10, y);

    // Detail rows
    const fields = [
      { label: 'Property', value: submitted.property_name },
      { label: 'Category', value: submitted.category },
      { label: 'Urgency Level', value: submitted.urgency },
    ];

    y += 8;
    fields.forEach((field) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(field.label.toUpperCase(), cardX + 10, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      if (field.label === 'Urgency Level') {
        const uColor = urgencyHex[field.value] || '#64748b';
        const r = parseInt(uColor.slice(1, 3), 16);
        const g = parseInt(uColor.slice(3, 5), 16);
        const b = parseInt(uColor.slice(5, 7), 16);
        doc.setFillColor(r, g, b);
        doc.roundedRect(cardX + cardW - 44, y - 4.5, 34, 7, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(field.value.toUpperCase(), cardX + cardW - 44 + 17, y + 0.5, { align: 'center' });
      } else {
        doc.text(field.value, cardX + cardW - 10, y, { align: 'right' });
      }

      y += 14;
    });

    // Description section
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(cardX + 10, y, cardX + cardW - 10, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('DESCRIPTION', cardX + 10, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(submitted.description, cardW - 20);
    doc.text(descLines, cardX + 10, y);

    // ── QR-style reference box ──
    y = 212;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, y, cardW, 30, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardW, 30, 3, 3, 'S');

    // Reference info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('REFERENCE', cardX + 10, y + 9);
    doc.text('GENERATED', cardX + cardW / 2, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(submitted.ticket_number, cardX + 10, y + 16);
    doc.text(`${dateStr} at ${timeStr}`, cardX + cardW / 2, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('This ticket is an official maintenance service request. Please retain for your records.', cardX + 10, y + 24);

    // ── Footer ──
    const footerY = ph - 18;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(16, footerY, pw - 16, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Maintenance Logger  •  Facility Management System', 20, footerY + 7);
    doc.text('Confidential', pw - 20, footerY + 7, { align: 'right' });

    // Left accent stripe on the card
    doc.setFillColor(79, 70, 229);
    doc.rect(cardX, 80, 3, 120, 'F');

    doc.save(`${submitted.ticket_number}_Maintenance_Ticket.pdf`);
    toast.success('Ticket PDF downloaded!');
  }

  // Success state
  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Issue Submitted!</h2>
        <div className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-mono text-lg px-4 py-2 rounded-xl mb-6">
          {submitted.ticket_number}
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 text-left mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Property</span>
            <span className="font-medium text-slate-800 dark:text-white">{submitted.property_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Category</span>
            <span className="font-medium text-slate-800 dark:text-white">{submitted.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Urgency</span>
            <span className="font-medium text-slate-800 dark:text-white">{submitted.urgency}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Description</span>
            <span className="text-slate-800 dark:text-white">{submitted.description}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={downloadTicketPDF}
            className="px-6 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-500 transition-all flex items-center justify-center gap-2"
          >
            <FileDown size={18} />
            Download Ticket PDF
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            Submit Another Issue
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Report an Issue</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Fill in the details below to submit a maintenance request.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Property Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Property Name</label>
          <select
            {...register('property_name')}
            className={`w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              errors.property_name ? 'border-red-400 ring-2 ring-red-400/30' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <option value="">Select a property</option>
            {PROPERTIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.property_name && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.property_name.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Issue Category</label>
          <select
            {...register('category')}
            className={`w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              errors.category ? 'border-red-400 ring-2 ring-red-400/30' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.category.message}
            </p>
          )}
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Urgency Level</label>
          <div className="flex gap-3">
            {URGENCIES.map((u) => (
              <label
                key={u}
                className={`flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-center text-sm font-medium transition-all ${
                  watch('urgency') === u
                    ? u === 'Low'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-600'
                      : u === 'Medium'
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-600'
                      : 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <input type="radio" value={u} {...register('urgency')} className="sr-only" />
                {u}
              </label>
            ))}
          </div>
          {errors.urgency && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.urgency.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Describe the issue in detail..."
            className={`w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none ${
              errors.description ? 'border-red-400 ring-2 ring-red-400/30' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.description ? (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.description.message}
              </p>
            ) : (
              <span />
            )}
            <span className={`text-xs ${description.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Photo <span className="text-slate-400 font-normal">(optional, max 5MB)</span>
          </label>
          <AnimatePresence mode="wait">
            {photoPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative inline-block"
              >
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.label
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-white/50 dark:bg-slate-900/50"
              >
                <Upload size={24} className="text-slate-400 mb-2" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Click to upload an image</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </motion.label>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-sm shadow-lg hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Issue'
          )}
        </button>
      </form>
    </motion.div>
  );
}
