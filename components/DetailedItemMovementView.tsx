
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, Filter, Calendar as CalendarIcon, LayoutPanelLeft } from 'lucide-react';
import { StockEntry } from '../types';

interface DetailedItemMovementViewProps {
  onBack: () => void;
}

const DetailedItemMovementView: React.FC<DetailedItemMovementViewProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [moveType, setMoveType] = useState('الكل');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sheno_stock_entries');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  const filtered = entries.filter(e => {
    const matchItem = !itemSearch || e.itemName.includes(itemSearch) || e.itemCode.includes(itemSearch);
    const matchType = moveType === 'الكل' || e.movementType === moveType;
    const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
    return matchItem && matchType && matchDate;
  });

  const totals = filtered.reduce((acc, curr) => {
    if (curr.movementType === 'إدخال') acc.in += curr.quantity;
    if (curr.movementType === 'صرف') acc.out += curr.quantity;
    if (curr.movementType === 'مرتجع') acc.ret += curr.quantity;
    return acc;
  }, { in: 0, out: 0, ret: 0 });

  return (
    <div className="space-y-6">
      {/* Header matching provided photo styles */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
         <button onClick={onBack} className="bg-rose-900 text-white px-6 py-2 rounded font-black shadow-lg flex items-center gap-2 border border-white/10">
            <LayoutPanelLeft className="w-5 h-5" /> EXIT
         </button>
         
         <div className="flex-1 flex flex-col items-center">
            <span className="bg-rose-900/50 px-4 py-1 rounded-t-lg text-white font-bold text-xs">ادخل اسم المادة أو الكود</span>
            <input 
              type="text" 
              value={itemSearch} 
              onChange={e => setItemSearch(e.target.value)}
              className="bg-white text-zinc-900 border-2 border-rose-900 text-center font-black text-xl w-full max-w-md py-2 rounded-b-lg outline-none"
              placeholder="البحث في الحركات..."
            />
         </div>

         <div className="bg-rose-900 px-8 py-3 rounded text-white font-black text-xl shadow-lg border border-white/20">
           تقرير حركة مادة مفصلة
         </div>
      </div>

      {/* Control Bar - Filters */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-center gap-6 shadow-md">
         <div className="flex items-center gap-2">
            <span className="text-xs font-black text-zinc-500">نوع الحركة</span>
            <select value={moveType} onChange={e => setMoveType(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-2 rounded-xl font-bold text-sm outline-none">
               <option value="الكل">جميع الحركات</option>
               <option value="إدخال">إدخال فقط</option>
               <option value="صرف">صرف فقط</option>
               <option value="مرتجع">مرتجع فقط</option>
            </select>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex flex-col">
               <span className="text-[10px] text-zinc-400 font-bold">من تاريخ</span>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-2 rounded-xl text-xs font-mono" />
            </div>
            <span className="text-zinc-300">←</span>
            <div className="flex flex-col">
               <span className="text-[10px] text-zinc-400 font-bold">إلى تاريخ</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-2 rounded-xl text-xs font-mono" />
            </div>
         </div>
         <div className="flex gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex flex-col items-center">
               <span className="text-[10px] font-black text-emerald-600 uppercase">إجمالي الإدخال</span>
               <span className="font-mono font-black text-emerald-500">{totals.in.toLocaleString()}</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl flex flex-col items-center">
               <span className="text-[10px] font-black text-rose-600 uppercase">إجمالي الصرف</span>
               <span className="font-mono font-black text-rose-500">{totals.out.toLocaleString()}</span>
            </div>
         </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
               <thead>
                  <tr className="bg-rose-900 text-white font-black h-12 text-center">
                     <th className="p-2 border border-rose-800">التاريخ</th>
                     <th className="p-2 border border-rose-800">الصنف</th>
                     <th className="p-2 border border-rose-800">الوحدة</th>
                     <th className="p-2 border border-rose-800">السعر</th>
                     <th className="p-2 border border-rose-800">نوع الحركة</th>
                     <th className="p-2 border border-rose-800">الكمية</th>
                     <th className="p-2 border border-rose-800">المستودع</th>
                     <th className="p-2 border border-rose-800">البيان / الملاحظات</th>
                  </tr>
               </thead>
               <tbody className="font-bold text-center">
                  {filtered.length === 0 ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="h-10 border-b border-zinc-100 dark:border-zinc-800">
                         {Array.from({ length: 8 }).map((__, j) => <td key={j} className="border-x border-zinc-100 dark:border-zinc-800"></td>)}
                      </tr>
                    ))
                  ) : (
                    filtered.map(e => (
                      <tr key={e.id} className="h-11 hover:bg-rose-50 dark:hover:bg-rose-900/10 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
                         <td className="p-2 font-mono text-zinc-400">{e.date}</td>
                         <td className="p-2 text-right pr-4">{e.itemName}</td>
                         <td className="p-2 text-zinc-500">{e.unit}</td>
                         <td className="p-2 font-mono">{e.price.toLocaleString()}</td>
                         <td className="p-2">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black ${
                              e.movementType === 'إدخال' ? 'bg-emerald-500/10 text-emerald-600' : 
                              e.movementType === 'صرف' ? 'bg-rose-500/10 text-rose-600' : 
                              'bg-amber-500/10 text-amber-600'
                            }`}>
                               {e.movementType}
                            </span>
                         </td>
                         <td className="p-2 font-mono text-lg text-primary">{e.quantity.toLocaleString()}</td>
                         <td className="p-2 text-[10px] text-zinc-400">{e.warehouse}</td>
                         <td className="p-2 text-right pr-4 text-zinc-500 font-normal">{e.statement}</td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
      
      <div className="flex justify-end no-print pt-4">
         <button onClick={() => window.print()} className="bg-rose-900 text-white px-12 py-3 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:bg-rose-800">
            <Printer className="w-6 h-6" /> طباعة تقرير الحركة المفصلة
         </button>
      </div>
    </div>
  );
};

export default DetailedItemMovementView;
