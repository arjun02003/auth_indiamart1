'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MoreHorizontal, Plus, FileText, MessageSquare, Phone } from 'lucide-react';

const STATUS_COLUMNS = [
  { id: 'NEW', label: 'New Lead', color: 'bg-blue-500' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-indigo-500' },
  { id: 'REQUIREMENT_GATHERING', label: 'Req. Gathering', color: 'bg-purple-500' },
  { id: 'QUOTATION_SENT', label: 'Quotation Sent', color: 'bg-amber-500' },
  { id: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-orange-500' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-pink-500' },
  { id: 'CONVERTED', label: 'Converted', color: 'bg-emerald-500' },
  { id: 'LOST', label: 'Lost', color: 'bg-red-500' },
];

export default function LeadsPipelinePage() {
  const [columns, setColumns] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads/kanban');
      setColumns(res.data);
    } catch (error) {
      console.error('Failed to load kanban data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Leads Pipeline</h2>
          <p className="text-sm text-slate-400">Manage and track your sales opportunities.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-4 items-start min-w-max">
          {STATUS_COLUMNS.map((col) => {
            const leads = columns[col.id] || [];
            
            return (
              <div key={col.id} className="w-80 flex flex-col max-h-full bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shrink-0">
                <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.color}`} />
                    <h3 className="font-semibold text-sm text-slate-200">{col.label}</h3>
                  </div>
                  <span className="bg-slate-800 text-slate-300 text-xs py-0.5 px-2 rounded-full font-medium">
                    {leads.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {leads.map((lead) => (
                    <div key={lead.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors cursor-pointer group shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-slate-200 line-clamp-1">{lead.name}</h4>
                        <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {lead.company && (
                        <p className="text-xs text-slate-400 mb-2 truncate">{lead.company}</p>
                      )}
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            lead.temperature === 'HOT' ? 'bg-red-500/20 text-red-400' :
                            lead.temperature === 'WARM' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {lead.temperature}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                            Score: {lead.qualificationScore}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-slate-500">
                          {lead._count?.quotations > 0 && <FileText className="w-3.5 h-3.5 text-amber-400" />}
                          <MessageSquare className="w-3.5 h-3.5 hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {leads.length === 0 && (
                    <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-700 rounded-lg">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
