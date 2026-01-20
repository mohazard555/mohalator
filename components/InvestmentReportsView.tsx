
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, TrendingUp, TrendingDown, PieChart, BarChart3, 
  Package, DollarSign, Hourglass, Star, FileDown, Printer, Filter, 
  Building, LayoutGrid, Calendar, Users
} from 'lucide-react';
import { 
  SalesInvoice, PurchaseInvoice, StockEntry, CashEntry, 
  InventoryItem, AppSettings, Party, PartyType 
} from '../types';
import { exportToCSV } from '../utils/export';

interface InvestmentReportsViewProps {
  onBack: () => void;
}

type ReportSubView = 'SUMMARY' | 'VALUATION' | 'PERFORMANCE' | 'HEALTH';

// Fix: Define interface for best seller items to ensure type safety throughout the component
interface BestSellerItem {
  name: string;
  code: string;
  qty: number;
  total: number;
}

const InvestmentReportsView: React.FC<InvestmentReportsViewProps> = ({ onBack }) => {
  const [subView, setSubView] = useState<ReportSubView>('SUMMARY');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [cashJournal, setCashJournal] = useState<CashEntry[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('الكل');

  useEffect(() => {
    const sInv = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sCash = localStorage.getItem('sheno_cash_journal');
    const sInvt = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');
    const sSett = localStorage.getItem('sheno_settings');
    const sPart = localStorage.getItem('sheno_parties');

    if (sInv) setSales(JSON.parse(sInv));
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sCash) setCashJournal(JSON.parse(sCash));
    if (sInvt) setInventory(JSON.parse(sInvt));
    if (sStock) setStockEntries(JSON.parse(sStock));
    if (sSett) setSettings(JSON.parse(sSett));
    if (sPart) setParties(JSON.parse(sPart));
  }, []);

  // Helper: Aggregate balances correctly based on all entries
  const getFullInventory = () => {
    return inventory.map(item => {
      const itemEntries = stockEntries.filter(e => e.itemCode === item.code);
      const added = itemEntries.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
      const issued = itemEntries.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
      const returned = itemEntries.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
      const current = item.openingStock + added - issued + returned;
      return { ...item, currentBalance: current };
    });
  };

  // --- 1. Investment Summary Data ---
  const totalSalesVal = sales.filter(s => s.date >= startDate && s.date <= endDate).reduce((s, c) => s + c.totalAmount, 0);
  const totalPurchVal = purchases.filter(p => p.date >= startDate && p.date <= endDate).reduce((s, c) => s + c.totalAmount, 0);
  const cashExpenses = cashJournal.filter(c => c.date >= startDate && c.date <= endDate).reduce((s, c) => s + (c.paidSYP + c.paidUSD), 0);
  const netProfit = totalSalesVal - totalPurchVal - cashExpenses;

  const currentInventory = getFullInventory();
  const stockCapital = currentInventory.reduce((s, i) => s + (i.currentBalance * i.price), 0);

  // --- 2. Valuation Data per Warehouse ---
  const valuationByWarehouse = Array.from(new Set(stockEntries.map(e => e.warehouse))).map(wh => {
    const warehouseItems = currentInventory.filter(item => {
      const latestMove = stockEntries.filter(e => e.itemCode === item.code).sort((a,b) => b.date.localeCompare(a.date))[0];
      return latestMove?.warehouse === wh;
    });
    const value = warehouseItems.reduce((s, i) => s + (i.currentBalance * i.price), 0);
    return { warehouse: wh, value, itemCount: warehouseItems.length };
  });

  // --- 3. Best Sellers ---
  // Fix: Aggregated best sellers with explicit types to resolve 'unknown' property errors
  const bestSellersMap = sales
    .filter(s => s.date >= startDate && s.date <= endDate)
    .flatMap(s => s.items)
    .reduce((acc, item) => {
      const current = acc.get(item.name) || { name: item.name, code: item.code, qty: 0, total: 0 };
      acc.set(item.name, { ...current, qty: current.qty + item.quantity, total: current.total + item.total });
      return acc;
    }, new Map<string, BestSellerItem>());

  const bestSellers: BestSellerItem[] = Array.from(bestSellersMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // --- 4. Stagnant Items (No movement in last 60 days) ---
  const stagnantItems = currentInventory.filter(item => {
    const latestMove = stockEntries.filter(e => e.itemCode === item.code).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latestMove) return true; // No movement at all
    const daysSince = (new Date().getTime() - new Date(latestMove.date).getTime()) / (1000 * 3600 * 24);
    return daysSince > 60 && item.currentBalance > 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-readable">التقارير الاستثمارية والذكاء المالي</h2>
            <p className="text-zinc-500 text-sm font-bold">تحليل دقيق للأرباح، الأصول، وحركة رأس المال</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="bg-zinc-800 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-lg">
             <Printer className="w-5 h-5" /> طباعة التقرير الشامل
           </button>
        </div>
      </div>

      {/* Tabs / Navigation */}
      <div className="flex flex-wrap gap-2 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-3xl no-print border border-zinc-200 dark:border-zinc-800">
         {[
           { id: 'SUMMARY', label: 'ملخص رأس المال والأرباح', icon: <PieChart className="w-4 h-4" /> },
           { id: 'VALUATION', label: 'تقييم المستودعات والأصول', icon: <Building className="w-4 h-4" /> },
           { id: 'PERFORMANCE', label: 'الأصناف الأكثر مبيعاً', icon: <Star className="w-4 h-4" /> },
           { id: 'HEALTH', label: 'الأصناف الراكدة (تنبيه)', icon: <Hourglass className="w-4 h-4" /> },
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setSubView(tab.id as ReportSubView)}
             className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${subView === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
           >
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {/* Content Areas */}
      {subView === 'SUMMARY' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           {/* Date Filter */}
           <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border flex items-center gap-4 no-print">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">نطاق التحليل المالي من</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl border font-mono outline-none" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">إلى</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl border font-mono outline-none" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-emerald-500/10 border-2 border-emerald-500/20 p-8 rounded-3xl flex flex-col items-center text-center gap-3">
                 <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><TrendingUp className="w-8 h-8" /></div>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي المبيعات (الفترة)</span>
                 <span className="text-3xl font-mono font-black text-emerald-600">{totalSalesVal.toLocaleString()}</span>
              </div>
              <div className="bg-rose-500/10 border-2 border-rose-500/20 p-8 rounded-3xl flex flex-col items-center text-center gap-3">
                 <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><TrendingDown className="w-8 h-8" /></div>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إجمالي المشتريات والمصاريف</span>
                 <span className="text-3xl font-mono font-black text-rose-600">{(totalPurchVal + cashExpenses).toLocaleString()}</span>
              </div>
              <div className={`p-8 rounded-3xl flex flex-col items-center text-center gap-3 border-2 ${netProfit >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${netProfit >= 0 ? 'bg-blue-500' : 'bg-amber-500'}`}><DollarSign className="w-8 h-8" /></div>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">صافي الأرباح التشغيلية</span>
                 <span className={`text-3xl font-mono font-black ${netProfit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>{netProfit.toLocaleString()}</span>
              </div>
              <div className="bg-primary/10 border-2 border-primary/20 p-8 rounded-3xl flex flex-col items-center text-center gap-3">
                 <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg"><Package className="w-8 h-8" /></div>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">رأس المال في المستودع (حالياً)</span>
                 <span className="text-3xl font-mono font-black text-primary">{stockCapital.toLocaleString()}</span>
              </div>
           </div>

           <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-xl flex flex-col items-center gap-6">
              <h3 className="text-xl font-black text-readable">قيمة الاستثمار الكلي (Net Equity)</h3>
              <div className="flex items-center gap-10">
                 <div className="flex flex-col items-center">
                    <span className="text-5xl font-mono font-black text-readable">{(stockCapital + netProfit).toLocaleString()}</span>
                    <span className="text-xs font-bold text-zinc-400 mt-2">القيمة التقديرية للمنشأة حالياً</span>
                 </div>
                 <div className="w-px h-20 bg-zinc-100 dark:bg-zinc-800"></div>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="text-xs font-bold">بضاعة: {((stockCapital / (stockCapital + netProfit)) * 100).toFixed(1)}%</span></div>
                    <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs font-bold">نقدية وأرباح: {((netProfit / (stockCapital + netProfit)) * 100).toFixed(1)}%</span></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {subView === 'VALUATION' && (
        <div className="animate-in slide-in-from-bottom-4 space-y-6">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl border overflow-hidden shadow-2xl">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b flex justify-between items-center">
                 <h3 className="text-lg font-black text-readable">تقييم المخزون حسب المستودع</h3>
                 <button onClick={() => exportToCSV(valuationByWarehouse, 'warehouse_valuation')} className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"><FileDown className="w-3 h-3" /> تصدير البيانات</button>
              </div>
              <table className="w-full text-right">
                 <thead>
                    <tr className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20 border-b">
                       <th className="p-4">اسم المستودع</th>
                       <th className="p-4 text-center">عدد الأصناف الفريدة</th>
                       <th className="p-4 text-center">القيمة الاستثمارية للمخزون</th>
                       <th className="p-4 text-center">الوزن النسبي</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y font-bold">
                    {valuationByWarehouse.map((wh, idx) => (
                       <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-4 text-readable">{wh.warehouse}</td>
                          <td className="p-4 text-center font-mono">{wh.itemCount}</td>
                          <td className="p-4 text-center font-mono text-primary text-xl">{wh.value.toLocaleString()}</td>
                          <td className="p-4 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                   <div className="h-full bg-primary" style={{ width: `${(wh.value / stockCapital) * 100}%` }}></div>
                                </div>
                                <span className="text-[10px] text-zinc-400">{((wh.value / stockCapital) * 100).toFixed(1)}%</span>
                             </div>
                          </td>
                       </tr>
                    ))}
                    <tr className="bg-zinc-50 dark:bg-zinc-800 font-black">
                       <td className="p-4 text-readable">إجمالي القيمة المستودعية</td>
                       <td className="p-4 text-center">---</td>
                       <td className="p-4 text-center text-rose-700 text-3xl font-mono">{stockCapital.toLocaleString()}</td>
                       <td className="p-4 text-center">100%</td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {subView === 'PERFORMANCE' && (
        <div className="animate-in slide-in-from-bottom-4 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border shadow-xl overflow-hidden">
                 <div className="p-6 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-3">
                    <Star className="text-emerald-600 w-6 h-6" />
                    <h3 className="font-black text-readable">الأصناف الذهبية (الأكثر مبيعاً)</h3>
                 </div>
                 <div className="p-4 space-y-3">
                    {/* Fix: item is now properly typed as BestSellerItem through explicit bestSellers typing */}
                    {bestSellers.map((item, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl group transition-all hover:translate-x-[-4px]">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center font-black text-xs">#{idx + 1}</div>
                             <div className="flex flex-col">
                                <span className="font-black text-readable">{item.name}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">CODE: {item.code}</span>
                             </div>
                          </div>
                          <div className="text-left">
                             <div className="text-sm font-black text-emerald-600">{item.total.toLocaleString()} {settings?.currencySymbol}</div>
                             <div className="text-[9px] font-bold text-zinc-400">باعت {item.qty} وحدة</div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center gap-6">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary"><BarChart3 className="w-10 h-10" /></div>
                 <h3 className="text-2xl font-black text-readable">تحليل التركيز البيعي</h3>
                 <p className="text-zinc-500 text-sm font-bold leading-relaxed">
                    {/* Fix: Resolved arithmetic operation error by ensuring reduce result and totalSalesVal are correctly treated as numbers */}
                    تعتمد {((bestSellers.reduce((s, c) => s + c.total, 0) / (totalSalesVal || 1)) * 100).toFixed(1)}% من إيراداتك على أفضل 10 أصناف فقط. 
                    <br /> يُنصح بتنويع المخزون أو تعزيز المواد الأكثر طلباً لزيادة الاستثمار.
                 </p>
              </div>
           </div>
        </div>
      )}

      {subView === 'HEALTH' && (
        <div className="animate-in slide-in-from-bottom-4 space-y-6">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl border-2 border-amber-500/30 overflow-hidden shadow-2xl">
              <div className="p-6 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
                 <Hourglass className="text-amber-600 w-6 h-6" />
                 <h3 className="font-black text-readable">الأصناف الراكدة (تجاوزت 60 يوماً بدون حركة)</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-right">
                    <thead>
                       <tr className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20 border-b">
                          <th className="p-4">كود</th>
                          <th className="p-4">اسم الصنف</th>
                          <th className="p-4 text-center">الرصيد المكدس</th>
                          <th className="p-4 text-center">القيمة المجمدة</th>
                          <th className="p-4 text-center">آخر حركة</th>
                          <th className="p-4 text-center">التوصية</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y font-bold">
                       {stagnantItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                             <td className="p-4 font-mono text-zinc-400">{item.code}</td>
                             <td className="p-4 text-readable">{item.name}</td>
                             <td className="p-4 text-center font-mono">{item.currentBalance.toLocaleString()}</td>
                             <td className="p-4 text-center font-mono text-rose-600">{(item.currentBalance * item.price).toLocaleString()}</td>
                             <td className="p-4 text-center font-mono text-xs text-zinc-400">
                                {stockEntries.filter(e => e.itemCode === item.code).sort((a,b) => b.date.localeCompare(a.date))[0]?.date || 'لم تسجل حركة'}
                             </td>
                             <td className="p-4 text-center">
                                <span className="text-[9px] font-black px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20">تصفية أو خصم</span>
                             </td>
                          </tr>
                       ))}
                       {stagnantItems.length === 0 && (
                          <tr><td colSpan={6} className="p-20 text-center text-emerald-500 italic">مبارك! مستودعك نشط بالكامل ولا يوجد مواد راكدة.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t flex justify-between items-center">
                 <span className="text-xs font-bold text-zinc-500">إجمالي رأس المال المجمد في المواد الراكدة:</span>
                 <span className="text-2xl font-mono font-black text-rose-700">{stagnantItems.reduce((s,i) => s + (i.currentBalance * i.price), 0).toLocaleString()} {settings?.currencySymbol}</span>
              </div>
           </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center py-10 no-print">
         <div className="flex items-center justify-center gap-3 mb-2">
            <LayoutGrid className="w-5 h-5 text-zinc-400" />
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{settings?.companyName} - قسم التحليل الاستثماري</span>
         </div>
         <p className="text-zinc-400 text-[10px] font-bold italic">نظام شينو المحاسبي © 2025 - جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
};

export default InvestmentReportsView;