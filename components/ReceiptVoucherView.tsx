
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Printer, User, Calendar as CalendarIcon, FileText, CheckCircle } from 'lucide-react';
import { CashEntry } from '../types';

interface ReceiptVoucherViewProps {
  onBack: () => void;
}

const ReceiptVoucherView: React.FC<ReceiptVoucherViewProps> = ({ onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [foundEntry, setFoundEntry] = useState<CashEntry | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_cash_journal');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  const handleSearch = () => {
    const match = entries.find(e => e.id.includes(searchId) || e.statement.includes(searchId));
    if (match) {
      setFoundEntry(match);
    } else {
      alert('لم يتم العثور على أي سند قبض بهذا الرقم أو البيان');
      setFoundEntry(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4" dir="rtl">
      {/* Search Header */}
      <div className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 flex items-center justify-between no-print shadow-2xl">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-zinc-300 transition-all">
              <ArrowRight className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black tracking-tight text-white">إيصال قبض مالي</h2>
         </div>
         <div className="flex gap-3">
            <div className="relative">
               <input 
                 type="text" 
                 value={searchId} 
                 onChange={e => setSearchId(e.target.value)} 
                 placeholder="ادخل رقم السند أو اسم العميل..."
                 className="bg-zinc-900 border border-zinc-700 rounded-xl py-3 pr-12 outline-none w-80 text-sm focus:ring-2 focus:ring-rose-500 transition-all" 
               />
               <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            </div>
            <button onClick={handleSearch} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95">بحث</button>
         </div>
      </div>

      {/* Main Receipt Content */}
      <div className="bg-white text-zinc-900 p-10 rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border-2 border-zinc-100 min-h-[500px] flex flex-col relative print:shadow-none print:border-none">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12 border-b-4 border-rose-900 pb-8">
           <div className="flex flex-col gap-2">
              <div className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-mono text-xl font-black shadow-lg">
                NO: {foundEntry?.id.slice(0, 8).toUpperCase() || 'SH-000000'}
              </div>
              <div className="flex items-center gap-2 text-zinc-500 font-bold">
                 <CalendarIcon className="w-4 h-4" />
                 <span>التاريخ:</span>
                 <span className="font-mono">{foundEntry?.date || '.... / .... / 2025'}</span>
              </div>
           </div>

           <div className="flex flex-col items-center">
              <div className="text-3xl font-black text-rose-900 mb-1">سند قبض مالي</div>
              <div className="text-zinc-400 font-bold tracking-[0.3em] text-xs">OFFICIAL RECEIPT</div>
           </div>

           <div className="flex flex-col items-end">
              <div className="flex items-center gap-3">
                 <div className="text-right">
                    <h1 className="text-4xl font-black text-rose-900 leading-none mb-1">SHENO</h1>
                    <div className="text-zinc-500 text-[8px] tracking-[0.2em] font-black text-left">SHENO FOR PRINT</div>
                 </div>
                 <div className="w-12 h-12 bg-rose-900 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                    <CheckCircle className="text-white w-8 h-8" />
                 </div>
              </div>
           </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-8 py-4">
           <div className="flex items-baseline gap-4 border-b border-zinc-200 pb-2">
              <span className="text-rose-900 font-black text-lg whitespace-nowrap">استلمنا من السيد/ة:</span>
              <span className="flex-1 text-2xl font-black border-zinc-300 px-2 italic">
                 {foundEntry?.partyName || foundEntry?.statement || '....................................................................'}
              </span>
           </div>

           <div className="flex items-baseline gap-4 border-b border-zinc-200 pb-2">
              <span className="text-rose-900 font-black text-lg whitespace-nowrap">مبلغاً وقدره:</span>
              <span className="flex-1 text-2xl font-black border-zinc-300 px-2 text-rose-700">
                 {foundEntry ? `${foundEntry.receivedSYP.toLocaleString()} ليرة سورية` : '....................................................................'}
              </span>
           </div>

           <div className="flex items-baseline gap-4 border-b border-zinc-200 pb-2">
              <span className="text-rose-900 font-black text-lg whitespace-nowrap">وذلك عن:</span>
              <span className="flex-1 text-xl font-bold border-zinc-300 px-2">
                 {foundEntry?.notes || '........................................................................................................'}
              </span>
           </div>

           {/* Amount Box */}
           <div className="flex justify-center mt-12">
              <div className="bg-zinc-900 p-1 rounded-2xl shadow-2xl">
                 <div className="bg-white border-4 border-rose-900 rounded-xl px-12 py-4 flex flex-col items-center min-w-[300px]">
                    <span className="text-xs font-black text-rose-900 mb-1">AMOUNT | المبلغ</span>
                    <span className="text-4xl font-black font-mono tracking-tighter">
                       {foundEntry ? foundEntry.receivedSYP.toLocaleString() : '0,000,000'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold mt-1">SYRIAN POUNDS | ليرة سورية</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Signatures */}
        <div className="mt-16 flex justify-between px-10 border-t-2 border-zinc-100 pt-8">
           <div className="flex flex-col items-center">
              <span className="text-zinc-400 font-bold text-xs mb-10">المستلم | RECEIVER</span>
              <div className="w-40 border-b border-zinc-300"></div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-zinc-400 font-bold text-xs mb-10">المحاسب | ACCOUNTANT</span>
              <div className="w-40 border-b border-zinc-300 font-black text-center text-zinc-900">أحمد شينو</div>
           </div>
        </div>

        {/* Print Button */}
        <div className="mt-12 flex justify-center no-print">
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-16 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-rose-800 transition-all active:scale-95">
             <Printer className="w-6 h-6" /> طباعة إيصال القبض
           </button>
        </div>
      </div>
      
      <div className="text-center text-zinc-500 text-xs no-print pb-10">
         ملاحظة: تظهر البيانات في الإيصال بمجرد البحث عن السند المسجل مسبقاً في دفتر اليومية.
      </div>
    </div>
  );
};

export default ReceiptVoucherView;
