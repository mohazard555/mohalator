
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

    // 1. صافي المبيعات
    const grossSales = safeRound(filteredSales.reduce((s, c) => s + c.items.reduce((sum, it) => sum + it.total, 0), 0));
    const salesReturnsVal = safeRound(filteredSalesReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const salesDiscountsVal = safeRound(filteredSales.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netSales = safeRound(grossSales - (salesReturnsVal + salesDiscountsVal));

    // 2. صافي المشتريات
    const grossPurchases = safeRound(filteredPurchases.reduce((s, c) => s + c.items.reduce((sum, it) => sum + it.total, 0), 0));
    const purchaseTransport = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.transportExpenses) || 0), 0));
    const pReturnsVal = safeRound(filteredPurchaseReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const pDiscountsVal = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netPurchases = safeRound((grossPurchases + purchaseTransport) - (pReturnsVal + pDiscountsVal));

    // 3. بضاعة أول المدة
    const openingStockInv = inventories
      .filter(i => i.type === 'OPENING' && i.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const openingStockValue = safeRound(openingStockInv?.totalValue || 0);
    const openingStockItems = openingStockInv?.items || [];

    // 4. بضاعة آخر المدة
    const calculateClosingStock = (targetDate: string) => {
      const items = inventoryList.map(item => {
        const moves = stockEntries.filter(e => e.itemCode === item.code && e.date <= targetDate);
        const added = moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
        const issued = moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
        const returned = moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
        const balance = (item.openingStock || 0) + added - issued + returned;
        return { name: item.name, code: item.code, quantity: balance, unit: item.unit, price: item.price, total: balance * item.price };
      });
      return { items: items.filter(i => i.quantity !== 0), total: items.reduce((s, i) => s + i.total, 0) };
    };

    const closingStock = calculateClosingStock(endDate);
    const closingStockValue = safeRound(closingStock.total);

    // 5. النتائج
    const cogs = safeRound(openingStockValue + netPurchases - closingStockValue);
    const grossProfit = safeRound(netSales - cogs);

    return { 
      netSales, netPurchases, grossPurchases, purchaseTransport, purchaseReturnsVal: pReturnsVal, purchaseDiscountsVal: pDiscountsVal,
      cogs, grossProfit, openingStockValue, openingStockItems, 
      closingStockValue, closingStockItems: closingStock.items,
      grossSalesVal: grossSales, salesReturnsVal, salesDiscountsVal,
      
      // تفاصيل إضافية للنافذة المنبثقة
      salesBreakdown: filteredSales.map(s => ({ date: s.date, number: s.invoiceNumber, party: s.customerName, statement: 'فاتورة مبيعات', value: s.items.reduce((acc, i) => acc + i.total, 0) })),
      salesReturnsBreakdown: filteredSalesReturns.map(r => ({ date: r.date, number: r.invoiceNumber, party: r.customerName, statement: 'مرتجع مبيعات', value: r.totalReturnAmount })),
      salesDiscountsBreakdown: filteredSales.filter(s => s.discountAmount > 0).map(s => ({ date: s.date, number: s.invoiceNumber, party: s.customerName, statement: 'حسم ممنوح زبون', value: s.discountAmount })),
      
      purchasesBreakdown: filteredPurchases.map(p => ({ date: p.date, number: p.invoiceNumber, party: p.supplierName, statement: 'فاتورة مشتريات', value: p.items.reduce((acc, i) => acc + i.total, 0) })),
      purchaseReturnsBreakdown: filteredPurchaseReturns.map(r => ({ date: r.date, number: r.invoiceNumber, party: r.supplierName, statement: 'مرتجع مشتريات', value: r.totalReturnAmount })),
      purchaseDiscountsBreakdown: filteredPurchases.filter(p => p.discountAmount > 0).map(p => ({ date: p.date, number: p.invoiceNumber, party: p.supplierName, statement: 'حسم مكتسب مورد', value: p.discountAmount })),
      transportBreakdown: filteredPurchases.filter(p => p.transportExpenses > 0).map(p => ({ date: p.date, number: p.invoiceNumber, party: p.supplierName, statement: 'مصاريف نقل توريد', value: p.transportExpenses })),
      
      saleItems: filteredSales.flatMap(s => s.items.map(i => ({ ...i, customer: s.customerName, invoice: s.invoiceNumber }))),
      purchaseItems: filteredPurchases.flatMap(p => p.items.map(i => ({ ...i, supplier: p.supplierName, invoice: p.invoiceNumber })))
    };
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
             <div className="p-3 bg-primary/10 rounded-2xl text-primary"><LayoutGrid className="w-8 h-8" /></div>
             <div>
                <h2 className="text-2xl font-black text-readable tracking-tight leading-none mb-1">تقرير حساب المتاجرة</h2>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Trading Account Statement</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Trading_Account')} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition-all">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110 transition-all">
              <Printer className="w-5 h-5" /> طباعة التقرير
           </button>
        </div>
      </div>

      <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between no-print mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-[10px] text-slate-400 font-black uppercase mr-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> نطاق مراجعة الأداء التجاري</span>
            <div className="flex items-center gap-3 mt-1">
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl text-xs font-mono font-black outline-none focus:border-primary transition-all shadow-inner" />
               <span className="text-slate-700 font-black">←</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl text-xs font-mono font-black outline-none focus:border-primary transition-all shadow-inner" />
            </div>
          </div>
          <div className="text-left text-xs font-bold text-slate-400 relative z-10">
             <p>نظام ساملاتور لإدارة الأعمال والذكاء المالي</p>
             <p className="text-[9px] uppercase tracking-widest text-slate-500">Secured Accounting Terminal v4.2</p>
          </div>
      </div>

      <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix">
          <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 text-zinc-900 dark:text-white">
             <div className="flex items-center gap-4">
                {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg">FIN</div>}
                <div><h1 className="text-2xl font-black">{settings?.companyName}</h1><p className="text-[10px] text-zinc-400 font-black uppercase mt-1 tracking-widest">{settings?.companyType}</p></div>
             </div>
             <div className="text-center">
                <h2 className="text-3xl font-black underline underline-offset-8 decoration-primary/20">حـسـاب الـمـتـاجـرة</h2>
                <p className="text-sm mt-4 font-black text-zinc-500 uppercase tracking-[0.2em]">للفترة من {startDate} إلى {endDate}</p>
             </div>
             <div className="text-left text-[10px] font-black text-zinc-400">
                <p className="mb-1">{settings?.address}</p>
                <p className="mb-4">{settings?.phone}</p>
                <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-[8px] uppercase tracking-widest">SAMLATOR SECURED DATA</span>
             </div>
          </div>

          <TradingAccountReport 
             fin={fin} 
             expandedSections={expandedSections}
             toggleSection={toggleSection}
             settings={settings}
          />
          
          <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t-2 border-zinc-100 text-[10px] font-black text-zinc-400">
             <div className="flex flex-col gap-1">
                <span>تاريخ استخراج التقرير آلياً: {new Date().toLocaleString('ar-SA')}</span>
                <span>النظام المحاسبي لا يقبل التعديل بعد الاعتماد</span>
             </div>
             <div className="text-center">
                <div className="w-48 border-b-2 border-zinc-300 mb-2 mx-auto"></div>
                <span>توقيع المدير المالي / الختم الرسمي</span>
             </div>
          </div>
      </div>
    </div>
  );
};

export default TradingAccountView;
