import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, TrendingUp, ImageIcon, Printer, Calendar } from 'lucide-react';
import { CashEntry, SalesInvoice, PurchaseInvoice, PeriodicInventory, InventoryItem, StockEntry, AccountingCategory, AppSettings } from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import IncomeStatementReport from './IncomeStatementReport';

interface IncomeStatementViewProps {
  onBack: () => void;
}

const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Data
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);

  useEffect(() => {
    const sSett = localStorage.getItem('sheno_settings');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    const sInvList = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');

    if (sSett) setSettings(JSON.parse(sSett));
    if (sJou) setJournal(JSON.parse(sJou));
    if (sSal) setSales(JSON.parse(sSal));
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sInv) setInventories(JSON.parse(sInv));
    if (sInvList) setInventoryList(JSON.parse(sInvList));
    if (sStock) setStockEntries(JSON.parse(sStock));
  }, []);

  const calculateFinancials = () => {
    const filteredJournal = journal.filter(j => j.date >= startDate && j.date <= endDate);
    const filteredSales = sales.filter(s => s.date >= startDate && s.date <= endDate);
    const filteredPurchases = purchases.filter(p => p.date >= startDate && p.date <= endDate);

    const openingStockInv = inventories.filter(i => i.type === 'OPENING' && i.date <= startDate).sort((a,b) => b.date.localeCompare(a.date))[0];
    const openingStockValue = openingStockInv?.totalValue || 0;

    const closingStockValue = inventoryList.reduce((sum, item) => {
        const moves = stockEntries.filter(e => e.itemCode === item.code && e.date <= endDate);
        const added = moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
        const issued = moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
        const returned = moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
        const balance = (item.openingStock || 0) + added - issued + returned;
        return sum + (balance * item.price);
    }, 0);

    const totalSales = filteredSales.reduce((s, c) => s + c.totalAmount, 0);
    const totalPurchases = filteredPurchases.reduce((s, c) => s + c.totalAmount, 0);
    const cogs = openingStockValue + totalPurchases - closingStockValue;
    const grossProfit = totalSales - cogs;

    const expenseCats = categories.filter(c => c.type === 'مصروفات').map(cat => ({
      id: cat.id,
      name: cat.name,
      total: filteredJournal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + (c.paidSYP || 0), 0),
      items: filteredJournal.filter(j => j.categoryId === cat.id).map(j => ({
         date: j.date,
         statement: j.statement,
         amount: j.paidSYP || 0
      }))
    })).filter(c => c.total > 0);

    const revenueCats = categories.filter(c => c.type === 'إيرادات').map(cat => ({
      id: cat.id,
      name: cat.name,
      total: filteredJournal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + (c.receivedSYP || 0), 0),
      items: filteredJournal.filter(j => j.categoryId === cat.id).map(j => ({
         date: j.date,
         statement: j.statement,
         amount: j.receivedSYP || 0
      }))
    })).filter(c => c.total > 0);

    const totalExpenses = expenseCats.reduce((s, c) => s + c.total, 0);
    const totalOtherRevenues = revenueCats.reduce((s, c) => s + c.total, 0);
    const netProfit = (grossProfit + totalOtherRevenues) - totalExpenses;

    return { grossProfit, netProfit, expenseCats, revenueCats, totalExpenses, totalOtherRevenues };
  };

  const fin = calculateFinancials();
  const toggleSection = (id: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedSections(newSet);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <TrendingUp className="w-8 h-8 text-primary" />
             <div>
                <h2 className="text-2xl font-black text-readable">قائمة الأرباح والخسائر</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تحليل الدخل والمصروفات التشغيلية</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Income_Statement')} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Printer className="w-5 h-5" /> طباعة
           </button>
        </div>
      </div>

      <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between no-print mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-black uppercase mr-1">نطاق التقرير الزمني</span>
            <div className="flex items-center gap-3">
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs font-mono outline-none" />
               <span className="text-slate-700 font-black">←</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs font-mono outline-none" />
            </div>
          </div>
      </div>

      <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix">
          <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 text-zinc-900 dark:text-white">
             <div className="flex items-center gap-4">
                {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl">SH</div>}
                <div><h1 className="text-xl font-black">{settings?.companyName}</h1><p className="text-[10px] text-zinc-400 font-black uppercase mt-1">{settings?.companyType}</p></div>
             </div>
             <div className="text-center">
                <h2 className="text-2xl font-black underline decoration-primary/20 underline-offset-8">قائمة الأرباح والخسائر</h2>
                <p className="text-[10px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">الفترة من: {startDate} إلى: {endDate}</p>
             </div>
             <div className="text-left text-[10px] font-black text-zinc-400">
                <p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p>
             </div>
          </div>

          <IncomeStatementReport 
             fin={fin} 
             settings={settings}
             expandedSections={expandedSections}
             toggleSection={toggleSection}
          />
      </div>
    </div>
  );
};

export default IncomeStatementView;