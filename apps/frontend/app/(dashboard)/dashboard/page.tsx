'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Users, UserCheck, Flame, XCircle, TrendingUp, DollarSign, FileText, Clock,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) return <div>Failed to load data</div>;

  const kpis = [
    { name: 'Total Leads', value: data.overview.totalLeads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'New Leads', value: data.overview.newLeads, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Hot Leads', value: data.overview.hotLeads, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { name: 'Converted', value: data.overview.convertedLeads, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h2>
          <p className="text-sm text-slate-400">Welcome back. Here's what's happening today.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="relative overflow-hidden rounded-xl bg-slate-900/50 backdrop-blur border border-slate-800 p-6 shadow-sm">
            <dt>
              <div className={`absolute rounded-lg p-3 ${kpi.bg}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-slate-400">{kpi.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
              <p className="text-2xl font-semibold text-white">{kpi.value}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Revenue Chart */}
        <div className="col-span-2 rounded-xl bg-slate-900/50 backdrop-blur border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold leading-6 text-white">Revenue This Month</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-white">
                  ₹{new Intl.NumberFormat('en-IN').format(data.revenue.thisMonth)}
                </span>
                <span className={`flex items-center text-sm font-medium ${data.revenue.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.revenue.growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(data.revenue.growth)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="h-[300px] mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.monthlyLeads}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="rounded-xl bg-slate-900/50 backdrop-blur border border-slate-800 p-6">
          <h3 className="text-base font-semibold leading-6 text-white mb-4">Pipeline Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-slate-200">Sent Quotations</span>
              </div>
              <span className="text-sm font-bold text-white">{data.overview.totalQuotations}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Accepted Quotes</span>
              </div>
              <span className="text-sm font-bold text-white">{data.overview.acceptedQuotations}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium text-slate-200">Pending Follow-ups</span>
              </div>
              <span className="text-sm font-bold text-white">{data.overview.pendingFollowUps}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="text-sm font-medium text-slate-200">Lost Deals</span>
              </div>
              <span className="text-sm font-bold text-white">{data.overview.lostLeads}</span>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Conversion Rate</h4>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{data.overview.conversionRate}%</span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${data.overview.conversionRate}%` }}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
