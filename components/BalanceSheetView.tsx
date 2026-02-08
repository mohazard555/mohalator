import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Scale, ImageIcon, Printer, Eye, EyeOff } from 'lucide-react';
import { CashEntry, SalesInvoice, PurchaseInvoice, PeriodicInventory, InventoryItem, StockEntry, OpeningEntry, Party, PartyType, AppSettings, AccountingCategory } from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import BalanceSheetReport from './BalanceSheetReport';

interface BalanceSheetViewProps {
  onBack: () => void;
}

const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showDetailsInPrint, setShowDetailsInPrint] = useState(false);

  // Data
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);

  useEffect(() => {
    const sSett = localStorage.getItem('sheno_settings');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sPar = localStorage.getItem('sheno_parties');
    const sInvList = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sPeriodic = localStorage.getItem('sheno_periodic_inventories');

    if (sSett) setSettings(JSON.parse(sSett));
    if (sJou) setJournal(JSON.parse(sJou));
    if (sSal) setSales(JSON.parse(sSal));
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sPar) setParties(JSON.parse(sPar));
    if (sInvList) setInventoryList(JSON.parse(sInvList));
    if (sStock) setStockEntries(JSON.parse(sStock));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sPeriodic) setInventories(JSON.parse(sPeriodic));
  }, []);

  const calculateFinancials = () => {
    const filteredJournal = journal.filter(j => j.date <= endDate);
    const filteredSales = sales.filter(s => s.date <= endDate);
    const filteredPurchases = purchases.filter(p => p.date <= endDate);

    // 1. بضاعة آخر المدة (الأصول)
    const closingStockItems = inventoryList.map(item => {
        const moves = stockEntries.filter(e => e.itemCode === item.code && e.date <= endDate);
        const added = moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
        const issued = moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
        const returned = moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
        const balance = (item.openingStock || 0) + added - issued + returned;
        return { name: item.name, quantity: balance, unit: item.unit, price: item.price, total: balance * item.price };
    }).filter(it => it.quantity !== 0);
    const closingStockValue = closingStockItems.reduce((sum, it) => sum + it.total, 0);

    // 2. النقدية (الأصول)
    const cashInHand = filteredJournal.reduce((s, c) => s + (Number(c.receivedSYP || 0) - Number(c.paidSYP || 0)), 0);
    
    // 3. الزبائن (الأصول)
    const receivablesList = parties.filter(p => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH).map(p => {
        const pSales = filteredSales.filter(inv => inv.customerName === p.name).reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pPaid = filteredJournal.filter(j => (j.partyName === p.name || j.statement.includes(p.name))).reduce((sum, j) => sum + j.receivedSYP, 0);
        return { name: p.name, balance: (p.openingBalance + pSales - pPaid) };
    }).filter(x => x.balance !== 0);
    const receivables = receivablesList.reduce((s,c) => s + c.balance, 0);

    // 4. الموردين (الخصوم)
    const payablesList = parties.filter(p => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH).map(p => {
        const pPurch = filteredPurchases.filter(inv => inv.supplierName === p.name).reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pPaid = filteredJournal.filter(j => (j.partyName === p.name || j.statement.includes(p.name))).reduce((sum, j) => sum + j.paidSYP, 0);
        return { name: p.name, balance: (p.openingBalance + pPurch - pPaid) };
    }).filter(x => x.balance !== 0);
    const payables = payablesList.reduce((s,c) => s + c.balance, 0);

    // 5. الأصول الثابتة ورأس المال (من القيود الافتتاحية)
    const fixedAssetsList = openingEntries.filter(e => e.accountType === 'أصول').map(e => ({ name: e.accountName, balance: e.debit - e.credit }));
    const fixedAssets = fixedAssetsList.reduce((s,c) => s + c.balance, 0);
    
    const equityList = openingEntries.filter(e => e.accountType === 'حقوق ملكية').map(e => ({ name: e.accountName, balance: e.credit - e.debit }));
    const equityOpening = equityList.reduce((s,c) => s + c.balance, 0);

    // 6. احتساب الأرباح المحققة (حقوق الملكية)
    const openingStockInv = inventories.find(i => i.type === 'OPENING');
    const openingStockValue = openingStockInv ? openingStockInv.totalValue : 0;
    const totalSales = filteredSales.reduce((s, c) => s + c.totalAmount, 0);
    const totalPurchases = filteredPurchases.reduce((s, c) => s + c.totalAmount, 0);
    
    const cogs = openingStockValue + totalPurchases - closingStockValue;
    const grossProfit = totalSales - cogs;
    
    // مصاريف وإيرادات تشغيلية من أقسام الحسابات
    const expenses = categories.filter(c => c.type === 'مصروفات').reduce((s, cat) => {
        return s + filteredJournal.filter(j => j.categoryId === cat.id).reduce((sum, curr) => sum + curr.paidSYP, 0);
    }, 0);
    const otherRevenues = categories.filter(c => c.type === 'إيرادات').reduce((s, cat) => {
        return s + filteredJournal.filter(j => j.categoryId === cat.id).reduce((sum, curr) => sum + curr.receivedSYP, 0);
    }, 0);

    const netProfit = grossProfit + otherRevenues - expenses;

    return { 
      closingStockValue, closingStockItems, cashInHand, receivables,
      payables, fixedAssets, equityOpening, netProfit,
      receivablesList, payablesList, fixedAssetsList, equityList
    };
  };

  const fin = calculateFinancials();

  const toggleSection = (id: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedSections(newSet);
  };

  const renderDetailTable = (data: { name: string; balance: number }[]) => {
    if (data.length === 0) return null;
    return (
      <div className={`mt-3 overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 ${!showDetailsInPrint ? 'no-print' : ''}`}>
        <table className="w-full text-right text-[10px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
            <tr className="text-zinc-500 font-black"><th className="p-2 border-l">البيان / الحساب</th><th className="p-2 text-center">الرصيد الجاري</th></tr>
          </thead>
          <tbody className="divide-y text-zinc-700 dark:text-zinc-300">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-50"><td className="p-2 border-l font-bold">{item.name}</td><td className="p-2 text-center font-mono font-black">{item.balance.toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <Scale className="w-8 h-8 text-primary" />
             <div>
                <h2 className="text-2xl font-black text-readable">الميزانية العمومية والمركز المالي</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">الأصول = الخصوم + حقوق الملكية</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowDetailsInPrint(!showDetailsInPrint)} className={`px-4 py-2.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-md ${showDetailsInPrint ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500 border'}`}>
              {showDetailsInPrint ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden md:inline">{showDetailsInPrint ? 'التفاصيل مفعلة' : 'إظهار التفاصيل'}</span>
           </button>
           <button onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Balance_Sheet')} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Printer className="w-5 h-5" /> طباعة
           </button>
        </div>
      </div>

      <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between no-print mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-black uppercase mr-1">تاريخ الميزانية الجاري</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs font-mono outline-none" />
          </div>
      </div>

      <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix">
          <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 text-zinc-900 dark:text-white">
             <div className="flex items-center gap-4">
                {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl">SH</div>}
                <div><h1 className="text-xl font-black">{settings?.companyName}</h1><p className="text-[10px] text-zinc-400 font-black uppercase mt-1">{settings?.companyType}</p></div>
             </div>
             <div className="text-center">
                <h2 className="text-2xl font-black underline decoration-primary/20 underline-offset-8">الميزانية العمومية</h2>
                <p className="text-[10px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">بتاريخ: {endDate}</p>
             </div>
             <div className="text-left text-[10px] font-black text-zinc-400">
                <p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p>
             </div>
          </div>

          <BalanceSheetReport 
             fin={fin} 
             expandedSections={expandedSections} 
             toggleSection={toggleSection} 
             renderDetailTable={renderDetailTable} 
          />
      </div>
    </div>
  );
};

export default BalanceSheetView;