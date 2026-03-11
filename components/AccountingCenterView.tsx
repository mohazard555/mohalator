
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Landmark, PieChart, Printer, ImageIcon, Plus, Save, X, ChevronDown, Scale, ListTree, Calendar, Tag, List, Package, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { 
  OpeningEntry, PeriodicInventory, AppSettings, CashEntry, 
  SalesInvoice, PurchaseInvoice, InventoryItem, StockEntry, 
  AccountingCategory, Party, PartyType, AccountNode
} from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import ChartOfAccountsView from './ChartOfAccountsView';

import BalanceSheetReport from './BalanceSheetReport';
import TradingAccountReport from './TradingAccountReport';
import IncomeStatementReport from './IncomeStatementReport';
import OpeningEntriesManager from './OpeningEntriesManager';
import { PrintHeader } from './PrintHeader';

const AccountingCenterView: React.FC<any> = ({ onBack, initialTab, initialReportType, isSingleView = false }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'REPORTS');
  const [reportType, setReportType] = useState(initialReportType || 'BALANCE_SHEET');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [allSales, setAllSales] = useState<SalesInvoice[]>([]);
  const [allSalesReturns, setAllSalesReturns] = useState<any[]>([]);
  const [allPurchases, setAllPurchases] = useState<PurchaseInvoice[]>([]);
  const [allPurchaseReturns, setAllPurchaseReturns] = useState<any[]>([]);
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);

  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showDetailsInPrint, setShowDetailsInPrint] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(1);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    const sSett = localStorage.getItem('sheno_settings');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sSalRet = localStorage.getItem('sheno_sales_returns');
    const sPur = localStorage.getItem('sheno_purchases');
    const sPurRet = localStorage.getItem('sheno_purchase_returns');
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    const sInvList = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');
    const sPar = localStorage.getItem('sheno_parties');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sOp = localStorage.getItem('sheno_opening_entries');

    if (sSett) setSettings(JSON.parse(sSett));
    if (sJou) setJournal(JSON.parse(sJou));
    if (sSal) setAllSales(JSON.parse(sSal));
    if (sSalRet) setAllSalesReturns(JSON.parse(sSalRet));
    if (sPur) setAllPurchases(JSON.parse(sPur));
    if (sPurRet) setAllPurchaseReturns(JSON.parse(sPurRet));
    if (sInv) setInventories(JSON.parse(sInv));
    if (sInvList) setInventoryList(JSON.parse(sInvList));
    if (sStock) setStockEntries(JSON.parse(sStock));
    if (sPar) setAllParties(JSON.parse(sPar));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
  };

  const safeRound = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const calculateFinancials = () => {
    const filteredSales = allSales.filter(s => s.date >= startDate && s.date <= endDate);
    const filteredSalesReturns = allSalesReturns.filter(r => r.date >= startDate && r.date <= endDate);
    const filteredPurchases = allPurchases.filter(p => p.date >= startDate && p.date <= endDate);
    const filteredPurchaseReturns = allPurchaseReturns.filter(r => r.date >= startDate && r.date <= endDate);
    const filteredJournal = journal.filter(j => j.date >= startDate && j.date <= endDate);

    // 1. صافي المبيعات = إجمالي المبيعات (Gross) - (المرتجع + الحسم الممنوح)
    const grossSalesVal = safeRound(filteredSales.reduce((s, c) => s + (c.items.reduce((sum, it) => sum + it.total, 0)), 0));
    const salesReturnsVal = safeRound(filteredSalesReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const salesDiscountsVal = safeRound(filteredSales.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netSales = safeRound(grossSalesVal - (salesReturnsVal + salesDiscountsVal));

    // 2. صافي المشتريات = (إجمالي المشتريات + النقل) - (المرتجع + الحسم المكتسب)
    const grossPurchasesVal = safeRound(filteredPurchases.reduce((s, c) => s + (c.items.reduce((sum, it) => sum + it.total, 0)), 0));
    const purchaseTransport = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.transportExpenses) || 0), 0));
    const purchaseReturnsVal = safeRound(filteredPurchaseReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const purchaseDiscountsVal = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netPurchases = safeRound((grossPurchasesVal + purchaseTransport) - (purchaseReturnsVal + purchaseDiscountsVal));

    // 3. بضاعة أول وآخر المدة
    const openingStockInv = inventories.filter(i => i.type === 'OPENING' && i.date <= startDate).sort((a,b) => b.date.localeCompare(a.date))[0];
    const openingStockValue = safeRound(openingStockInv?.totalValue || 0);

    const closingStockItems = inventoryList.map(item => {
        const moves = stockEntries.filter(e => e.itemCode === item.code && e.date <= endDate);
        const bal = safeRound((item.openingStock || 0) + 
                   moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0) - 
                   moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0) + 
                   moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0));
        return { code: item.code, name: item.name, unit: item.unit, quantity: bal, price: item.price, total: safeRound(bal * item.price) };
    }).filter(it => it.quantity !== 0);
    const closingStockValue = safeRound(closingStockItems.reduce((sum, it) => sum + it.total, 0));

    // 4. تكلفة البضاعة المباعة والنتائج
    const cogs = safeRound(openingStockValue + netPurchases - closingStockValue);
    const grossProfit = safeRound(netSales - cogs);

    // 5. المصاريف والإيرادات التشغيلية (يتم استبعاد حركات الحسم إذا كانت مسجلة بالخطأ في اليومية)
    const expenseCats = categories.filter(c => c.type === 'مصروفات').map(cat => ({
      id: cat.id, name: cat.name,
      total: safeRound(filteredJournal.filter(j => j.categoryId === cat.id && j.type !== 'حسم').reduce((s, c) => s + (c.paidSYP || 0), 0)),
      items: filteredJournal.filter(j => j.categoryId === cat.id && j.type !== 'حسم').map(j => ({ date: j.date, statement: j.statement, amount: j.paidSYP }))
    })).filter(c => c.total > 0);

    const revenueCats = categories.filter(c => c.type === 'إيرادات').map(cat => ({
      id: cat.id, name: cat.name,
      total: safeRound(filteredJournal.filter(j => j.categoryId === cat.id && j.type !== 'حسم').reduce((s, c) => s + (c.receivedSYP || 0), 0)),
      items: filteredJournal.filter(j => j.categoryId === cat.id && j.type !== 'حسم').map(j => ({ date: j.date, statement: j.statement, amount: j.receivedSYP }))
    })).filter(c => c.total > 0);

    const totalOtherRevenues = revenueCats.reduce((s, c) => s + c.total, 0);
    const totalExpenses = expenseCats.reduce((s, c) => s + c.total, 0);
    const netProfit = safeRound((grossProfit + totalOtherRevenues) - totalExpenses);

    // أرصدة الميزانية العمومية
    const cashInHand = Math.abs(journal.filter(j => j.date <= endDate).reduce((s, c) => s + (Number(c.receivedSYP || 0) - Number(c.paidSYP || 0)), 0));
    
    const receivablesList = allParties.filter(p => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH).map(p => {
        const pSales = allSales.filter(inv => inv.customerName === p.name && inv.date <= endDate).reduce((sum, inv) => sum + inv.items.reduce((s,i) => s + i.total, 0), 0);
        const pReturns = allSalesReturns.filter(ret => ret.customerName === p.name && ret.date <= endDate).reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);
        const pDiscounts = allSales.filter(inv => inv.customerName === p.name && inv.date <= endDate).reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
        const pPaid = journal.filter(j => (j.partyName === p.name || j.statement.includes(p.name)) && j.date <= endDate && j.type !== 'حسم').reduce((sum, j) => sum + (j.receivedSYP + j.receivedUSD), 0);
        return { name: p.name, balance: Math.abs(p.openingBalance + pSales - pReturns - pDiscounts - pPaid) };
    }).filter(x => x.balance !== 0);
    const receivables = receivablesList.reduce((s,c) => s + c.balance, 0);

    const payablesList = allParties.filter(p => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH).map(p => {
        const pPurch = allPurchases.filter(inv => inv.supplierName === p.name && inv.date <= endDate).reduce((sum, inv) => sum + (inv.items.reduce((s,i) => s + i.total, 0) + (inv.transportExpenses || 0)), 0);
        const pReturns = allPurchaseReturns.filter(ret => ret.supplierName === p.name && ret.date <= endDate).reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);
        const pDiscounts = allPurchases.filter(inv => inv.supplierName === p.name && inv.date <= endDate).reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
        const pPaid = journal.filter(j => (j.partyName === p.name || j.statement.includes(p.name)) && j.date <= endDate && j.type !== 'حسم').reduce((sum, j) => sum + (j.paidSYP + j.paidUSD), 0);
        return { name: p.name, balance: Math.abs(p.openingBalance + pPurch - pReturns - pDiscounts - pPaid) };
    }).filter(x => x.balance !== 0);
    const payables = payablesList.reduce((s,c) => s + c.balance, 0);

    const fixedAssetsList = openingEntries.filter(e => e.accountType === 'أصول').map(e => ({ name: e.accountName, balance: Math.abs(e.debit - e.credit) }));
    const fixedAssets = fixedAssetsList.reduce((s,c) => s + c.balance, 0);
    const equityList = openingEntries.filter(e => e.accountType === 'حقوق ملكية').map(e => ({ name: e.accountName, balance: Math.abs(e.credit - e.debit) }));
    const equityOpening = equityList.reduce((s,c) => s + c.balance, 0);

    return { 
      grossSalesVal, netSales, salesReturnsVal, salesDiscountsVal,
      grossPurchasesVal, netPurchases, purchaseTransport, purchaseReturnsVal, purchaseDiscountsVal,
      cogs, grossProfit, netProfit, 
      openingStockValue, openingStockItems: openingStockInv?.items || [], 
      closingStockValue, closingStockItems, 
      cashInHand, receivables, payables, fixedAssets, equityOpening, 
      expenseCats, revenueCats, totalExpenses, totalOtherRevenues,
      receivablesList, payablesList, fixedAssetsList, equityList,
      saleItems: filteredSales.flatMap(s => s.items.map(i => ({ ...i, customer: s.customerName, invoice: s.invoiceNumber }))),
      purchaseItems: filteredPurchases.flatMap(p => p.items.map(i => ({ ...i, supplier: p.supplierName, invoice: p.invoiceNumber })))
    };
  };

  const fin = calculateFinancials();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all"><ArrowRight className="w-6 h-6" /></button>
          <div className="flex items-center gap-3">
             <Landmark className="w-8 h-8 text-primary" />
             <div>
                <h2 className="text-2xl font-black text-readable">
                   {activeTab === 'REPORTS' ? (reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' : reportType === 'TRADING' ? 'حساب المتاجرة' : 'الأرباح والخسائر') : 'المركز المالي'}
                </h2>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           {activeTab === 'REPORTS' && (
             <button onClick={() => setShowDetailsInPrint(!showDetailsInPrint)} className={`px-4 py-2.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-md ${showDetailsInPrint ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500 border'}`}>
                  {showDetailsInPrint ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="hidden md:inline">التفاصيل في الطباعة</span>
             </button>
           )}
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110"><Printer className="w-5 h-5" /> طباعة</button>
        </div>
      </div>

      <div className="flex bg-zinc-100 dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 no-print">
         <button onClick={() => setActiveTab('REPORTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm transition-all ${activeTab === 'REPORTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>التقارير الختامية</button>
         <button onClick={() => setActiveTab('CHART_OF_ACCOUNTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm transition-all ${activeTab === 'CHART_OF_ACCOUNTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>دليل الحسابات</button>
         <button onClick={() => setActiveTab('OPENING_ENTRY')} className={`flex-1 py-4 rounded-3xl font-black text-sm transition-all ${activeTab === 'OPENING_ENTRY' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>القيد الافتتاحي</button>
      </div>

      {activeTab === 'REPORTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-1 space-y-3 no-print">
              <button onClick={() => setReportType('BALANCE_SHEET')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'BALANCE_SHEET' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>الميزانية العمومية</button>
              <button onClick={() => setReportType('TRADING')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'TRADING' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>حساب المتاجرة</button>
              <button onClick={() => setReportType('INCOME_STATEMENT')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'INCOME_STATEMENT' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>قائمة الأرباح والخسائر</button>
              <div className="pt-6 border-t dark:border-zinc-800 mt-4">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2">تاريخ التقرير</span>
                 <div className="flex flex-col gap-2 mt-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-xl text-xs outline-none" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 border p-3 rounded-xl text-xs outline-none" />
                 </div>
              </div>
           </div>

           <div className="lg:col-span-3">
              <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border shadow-2xl export-fix min-h-[500px] flex flex-col">
                 <PrintHeader settings={settings} title={reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' : reportType === 'INCOME_STATEMENT' ? 'قائمة الأرباح والخسائر' : 'حساب المتاجرة'} period={`الفترة من: ${startDate} إلى: ${endDate}`} />
                 
                 <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 text-zinc-900 dark:text-white print:hidden">
                    <div className="flex items-center gap-4">
                       {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl">SH</div>}
                       <div><h1 className="text-xl font-black">{settings?.companyName}</h1><p className="text-[10px] text-zinc-400 font-black uppercase mt-1">{settings?.companyType}</p></div>
                    </div>
                    <div className="text-center">
                       <h2 className="text-2xl font-black underline decoration-primary/20 underline-offset-8">{reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' : reportType === 'INCOME_STATEMENT' ? 'قائمة الأرباح والخسائر' : 'حساب المتاجرة'}</h2>
                       <p className="text-[10px] mt-4 font-bold text-zinc-400">الفترة من: {startDate} إلى: {endDate}</p>
                    </div>
                    <div className="text-left text-[10px] font-black text-zinc-400"><p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p></div>
                 </div>

                 {reportType === 'BALANCE_SHEET' && <BalanceSheetReport fin={fin} expandedSections={expandedSections} toggleSection={(id) => { const n = new Set(expandedSections); if(n.has(id)) n.delete(id); else n.add(id); setExpandedSections(n); }} displayLevel={displayLevel} renderDetailTable={(data) => <div className={`mt-3 border rounded-xl bg-white dark:bg-zinc-950 ${!showDetailsInPrint ? 'no-print' : ''}`}><table className="w-full text-[10px]"><thead className="bg-zinc-50 border-b"><tr><th className="p-2 text-right">البيان</th><th className="p-2 text-center">الرصيد</th></tr></thead><tbody>{data.map((it, i) => <tr key={i} className="border-b"><td className="p-2">{it.name}</td><td className="p-2 text-center font-mono font-black">{(it.balance || 0).toLocaleString()}</td></tr>)}</tbody></table></div>} />}
                 {reportType === 'TRADING' && <TradingAccountReport fin={fin} expandedSections={expandedSections} toggleSection={(id) => { const n = new Set(expandedSections); if(n.has(id)) n.delete(id); else n.add(id); setExpandedSections(n); }} />}
                 {reportType === 'INCOME_STATEMENT' && <IncomeStatementReport fin={fin} settings={settings} expandedSections={expandedSections} toggleSection={(id) => { const n = new Set(expandedSections); if(n.has(id)) n.delete(id); else n.add(id); setExpandedSections(n); }} />}
              </div>
           </div>
        </div>
      )}
      {activeTab === 'CHART_OF_ACCOUNTS' && <ChartOfAccountsView />}
    </div>
  );
};

export default AccountingCenterView;
