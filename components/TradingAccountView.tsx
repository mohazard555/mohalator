import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, LayoutGrid, ImageIcon, Printer, Calendar } from 'lucide-react';
import { CashEntry, SalesInvoice, PurchaseInvoice, PeriodicInventory, InventoryItem, StockEntry, AppSettings } from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import TradingAccountReport from './TradingAccountReport';

interface TradingAccountViewProps {
  onBack: () => void;
}

const TradingAccountView: React.FC<TradingAccountViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Data
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);

  useEffect(() => {
    const sSett = localStorage.getItem('sheno_settings');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sSalRet = localStorage.getItem('sheno_sales_returns');
    const sPur = localStorage.getItem('sheno_purchases');
    const sPurRet = localStorage.getItem('sheno_purchase_returns');
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    const sInvList = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');

    if (sSett) setSettings(JSON.parse(sSett));
    if (sSal) setSales(JSON.parse(sSal));
    if (sSalRet) setSalesReturns(JSON.parse(sSalRet));
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sPurRet) setPurchaseReturns(JSON.parse(sPurRet));
    if (sInv) setInventories(JSON.parse(sInv));
    if (sInvList) setInventoryList(JSON.parse(sInvList));
    if (sStock) setStockEntries(JSON.parse(sStock));
  }, []);

  const safeRound = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const calculateFinancials = () => {
    const filteredSales = sales.filter(s => s.date >= startDate && s.date <= endDate);
    const filteredSalesReturns = salesReturns.filter(r => r.date >= startDate && r.date <= endDate);
    const filteredPurchases = purchases.filter(p => p.date >= startDate && p.date <= endDate);
    const filteredPurchaseReturns = purchaseReturns.filter(r => r.date >= startDate && r.date <= endDate);

    // 1. المبيعات
    const grossSales = safeRound(filteredSales.reduce((s, c) => s + c.items.reduce((sum, it) => sum + it.total, 0), 0));
    const salesReturnsVal = safeRound(filteredSalesReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const salesDiscountsVal = safeRound(filteredSales.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netSales = safeRound(grossSales - salesReturnsVal - salesDiscountsVal);

    // 2. المشتريات (صافي المشتريات)
    const grossPurchases = safeRound(filteredPurchases.reduce((s, c) => s + c.items.reduce((sum, it) => sum + it.total, 0), 0));
    const purchaseTransport = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.transportExpenses) || 0), 0));
    const purchaseReturnsVal = safeRound(filteredPurchaseReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const purchaseDiscountsVal = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netPurchases = safeRound(grossPurchases + purchaseTransport - purchaseReturnsVal - purchaseDiscountsVal);

    // 3. المخزون
    const openingStockInv = inventories.filter(i => i.type === 'OPENING' && i.date <= startDate).sort((a,b) => b.date.localeCompare(a.date))[0];
    const openingStockValue = openingStockInv?.totalValue || 0;
    const openingStockItems = openingStockInv?.items || [];

    const closingStockItems = inventoryList.map(item => {
        const moves = stockEntries.filter(e => e.itemCode === item.code && e.date <= endDate);
        const bal = (item.openingStock || 0) + 
                   moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0) - 
                   moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0) + 
                   moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
        return { code: item.code, name: item.name, quantity: bal, price: item.price, total: bal * item.price };
    }).filter(it => it.quantity !== 0);

    const closingStockValue = safeRound(closingStockItems.reduce((sum, it) => sum + it.total, 0));

    // 4. تكلفة البضاعة المباعة والمجمل
    const cogs = safeRound(openingStockValue + netPurchases - closingStockValue);
    const grossProfit = safeRound(netSales - cogs);

    const purchaseItems = filteredPurchases.flatMap(p => p.items.map(i => ({ ...i, supplier: p.supplierName, invoice: p.invoiceNumber })));
    const saleItems = filteredSales.flatMap(s => s.items.map(i => ({ ...i, customer: s.customerName, invoice: s.invoiceNumber })));

    return { 
      netSales, netPurchases, grossPurchases, purchaseTransport, purchaseReturnsVal, purchaseDiscountsVal,
      cogs, grossProfit, openingStockValue, openingStockItems, 
      closingStockValue, closingStockItems, purchaseItems, saleItems 
    };
  };

  const fin = calculateFinancials();
  const toggleSection = (id: string) => {
    const newSet = new Set(expandedSections);
    // Fix: replaced undefined variable 'n' with 'newSet'
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
             <LayoutGrid className="w-8 h-8 text-primary" />
             <div>
                <h2 className="text-2xl font-black text-readable">حساب المتاجرة</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">تحليل النشاط التجاري ومجمل الأرباح</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Trading_Account')} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
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
                <h2 className="text-2xl font-black underline decoration-primary/20 underline-offset-8">حساب المتاجرة</h2>
                <p className="text-[10px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">الفترة من: {startDate} إلى: {endDate}</p>
             </div>
             <div className="text-left text-[10px] font-black text-zinc-400">
                <p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p>
             </div>
          </div>

          <TradingAccountReport 
             fin={fin} 
             expandedSections={expandedSections}
             toggleSection={toggleSection}
          />
      </div>
    </div>
  );
};

export default TradingAccountView;