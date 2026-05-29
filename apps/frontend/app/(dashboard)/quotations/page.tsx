'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { FileText, Download, Mail, MoreVertical, Plus } from 'lucide-react';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data.quotations);
    } catch (error) {
      console.error('Failed to fetch quotations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id: string, number: string) => {
    try {
      const res = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF', error);
    }
  };

  const handleSendEmail = async (id: string) => {
    if (!confirm('Are you sure you want to email this quotation to the customer?')) return;
    try {
      await api.post(`/quotations/${id}/send-email`);
      alert('Email sent successfully!');
      fetchQuotations();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send email');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Quotations</h2>
          <p className="text-sm text-slate-400">Manage and track generated quotations.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Create Quotation
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Number</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/30">
              {quotations.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-200">{quote.quotationNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-200">{quote.customer?.name || quote.lead.name}</div>
                    <div className="text-xs text-slate-500">{quote.customer?.company || quote.lead.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-white">₹{new Intl.NumberFormat('en-IN').format(quote.grandTotal)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {format(new Date(quote.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      quote.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      quote.status === 'SENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      quote.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      quote.status === 'EXPIRED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20' // DRAFT
                    }`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-3">
                      <button 
                        onClick={() => handleSendEmail(quote.id)}
                        className="text-slate-400 hover:text-blue-400 transition-colors"
                        title="Email to Customer"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(quote.id, quote.quotationNumber)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-slate-400 hover:text-slate-200 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="mx-auto h-12 w-12 text-slate-700 mb-3" />
                    <p>No quotations found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
