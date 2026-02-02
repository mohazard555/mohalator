
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Landmark, PieChart, Printer, ImageIcon, Plus, Save, X, ChevronDown, Scale, ListTree, Calendar, Tag, List, Package, Eye, EyeOff
} from 'lucide-react';
import { 
  OpeningEntry, PeriodicInventory, AppSettings, CashEntry, 
  SalesInvoice, PurchaseInvoice, InventoryItem, StockEntry, 
  AccountingCategory, Party, PartyType, AccountNode
} from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import ChartOfAccountsView from './ChartOfAccountsView';

// استيراد المكونات المقسمة حديثاً
import BalanceSheetReport from './BalanceSheetReport';
import TradingAccountReport from './TradingAccountReport';
import IncomeStatementReport from './IncomeStatementReport';
import OpeningEntriesManager from './OpeningEntriesManager';
import PeriodicInventoryManager from './PeriodicInventoryManager';

interface AccountingCenterViewProps {
  onBack: () => void;
  initialTab?: 'REPORTS' | 'OPENING_ENTRY' | 'INVENTORY_TOOLS' | 'CHART_OF_ACCOUNTS';
  initialReportType?: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'TRADING';
  isSingleView?: boolean;
}

const AccountingCenterView: React.FC<AccountingCenterViewProps> = ({ 
  onBack, 
  initialTab, 
  initialReportType,
  isSingleView = false 
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'OPENING_ENTRY' | 'INVENTORY_TOOLS' | 'CHART_OF_ACCOUNTS'>(initialTab || 'REPORTS');
  const [reportType, setReportType] = useState<'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'TRADING'>(initialReportType || 'BALANCE_SHEET');
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [inventories, setInventories] = useState<PeriodicInventory[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [allSales, setAllSales] = useState<SalesInvoice[]>([]);
  const [allPurchases, setAllPurchases] = useState<PurchaseInvoice[]>([]);
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [chartAccounts, setChartAccounts] = useState<AccountNode[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingInventory, setIsAddingInventory] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showDetailsInPrint, setShowDetailsInPrint] = useState(false);

  // Form States
  const [openingEntryForm, setOpeningEntryForm] = useState<Partial<OpeningEntry>>({
    accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [invItemForm, setInvItemForm] = useState({
    itemCode: '', itemName: '', quantity: 0, price: 0, warehouse: 'المستودع الرئيسي', notes: ''
  });
  const [tempInvItems, setTempInvItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sSett = localStorage.getItem('sheno_settings');
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sInv = localStorage.getItem('sheno_periodic_inventories');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sPar = localStorage.getItem('sheno_parties');
    const sChart = localStorage.getItem('sheno_chart_accounts');
    const sInvList = localStorage.getItem('sheno_inventory_list');
    const sStock = localStorage.getItem('sheno_stock_entries');
    
    if (sSett) setSettings(JSON.parse(sSett));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sInv) setInventories(JSON.parse(sInv));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sJou) setJournal(JSON.parse(sJou));
    if (sSal) setAllSales(JSON.parse(sSal));
    if (sPur) setAllPurchases(JSON.parse(sPur));
    if (sPar) setAllParties(JSON.parse(sPar));
    if (sChart) setChartAccounts(JSON.parse(sChart));
    if (sInvList) setInventoryList(JSON.parse(sInvList));
    if (sStock) setStockEntries(JSON.parse(sStock));
  };

  const calculateFinancials = () => {
    const filteredJournal = journal.filter(j => j.date >= startDate && j.date <= endDate);
    const filteredSales = allSales.filter(s => s.date >= startDate && s.date <= endDate);
    const filteredPurchases = allPurchases.filter(p => p.date >= startDate && p.date <= endDate);

    // بضاعة أول المدة
    const openingStockInv = inventories.filter(i => i.type === 'OPENING' && i.date <= startDate).sort((a,b) => b.date.localeCompare(a.date))[0];
    const openingStockValue = openingStockInv?.totalValue || 0;
    const openingStockItems = openingStockInv?.items || [];

    // بضاعة آخر المدة
    const closingStockItems = inventoryList.map(item => {
        const moves = stockEntries.filter(e => e.itemCode === item.code && e.date <= endDate);
        const added = moves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
        const issued = moves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
        const returned = moves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
        const balance = (item.openingStock || 0) + added - issued + returned;
        return {
           code: item.code,
           name: item.name,
           unit: item.unit,
           quantity: balance,
           price: item.price,
           total: balance * item.price
        };
    }).filter(it => it.quantity !== 0);

    const closingStockValue = closingStockItems.reduce((sum, it) => sum + it.total, 0);

    // تفاصيل الحركات للمتاجرة
    const purchaseItems = filteredPurchases.flatMap(p => p.items.map(i => ({ ...i, supplier: p.supplierName, date: p.date, invoice: p.invoiceNumber })));
    const saleItems = filteredSales.flatMap(s => s.items.map(i => ({ ...i, customer: s.customerName, date: s.date, invoice: s.invoiceNumber })));

    // الأرباح والخسائر - تفصيل
    const expenseCats = categories.filter(c => c.type === 'مصروفات').map(cat => ({
      id: cat.id,
      name: cat.name,
      total: filteredJournal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + (c.paidSYP || 0), 0),
      items: filteredJournal.filter(j => j.categoryId === cat.id)
    })).filter(c => c.total > 0);

    const revenueCats = categories.filter(c => c.type === 'إيرادات').map(cat => ({
      id: cat.id,
      name: cat.name,
      total: filteredJournal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + (c.receivedSYP || 0), 0),
      items: filteredJournal.filter(j => j.categoryId === cat.id)
    })).filter(c => c.total > 0);

    const totalSales = filteredSales.reduce((s, c) => s + c.totalAmount, 0);
    const totalPurchases = filteredPurchases.reduce((s, c) => s + c.totalAmount, 0);
    const totalExpenses = expenseCats.reduce((s, c) => s + c.total, 0);
    const totalOtherRevenues = revenueCats.reduce((s, c) => s + c.total, 0);

    const cogs = openingStockValue + totalPurchases - closingStockValue;
    const grossProfit = totalSales - cogs;
    const netProfit = (grossProfit + totalOtherRevenues) - totalExpenses;
    const cashInHand = filteredJournal.reduce((s, c) => s + (c.receivedSYP - c.paidSYP), 0);
    
    const receivablesList = allParties.filter(p => p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH).map(p => {
        const pSales = allSales.filter(inv => inv.customerName === p.name && inv.date <= endDate).reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pPaid = journal.filter(j => (j.partyName === p.name || j.statement.includes(p.name)) && j.date <= endDate).reduce((sum, j) => sum + j.receivedSYP, 0);
        return { name: p.name, balance: (p.openingBalance + pSales - pPaid) };
    }).filter(x => x.balance !== 0);

    const payablesList = allParties.filter(p => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH).map(p => {
        const pPurch = allPurchases.filter(inv => inv.supplierName === p.name && inv.date <= endDate).reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pPaid = journal.filter(j => (j.partyName === p.name || j.statement.includes(p.name)) && j.date <= endDate).reduce((sum, j) => sum + j.paidSYP, 0);
        return { name: p.name, balance: (p.openingBalance + pPurch - pPaid) };
    }).filter(x => x.balance !== 0);

    const fixedAssetsList = openingEntries.filter(e => e.accountType === 'أصول').map(e => ({ name: e.accountName, balance: e.debit - e.credit }));
    const equityList = openingEntries.filter(e => e.accountType === 'حقوق ملكية').map(e => ({ name: e.accountName, balance: e.credit - e.debit }));

    return { 
      totalSales, totalPurchases, totalExpenses, totalOtherRevenues, cogs, grossProfit, netProfit, 
      openingStockValue, openingStockItems, closingStockValue, closingStockItems, cashInHand,
      purchaseItems, saleItems,
      receivables: receivablesList.reduce((s,c) => s + c.balance, 0),
      payables: payablesList.reduce((s,c) => s + c.balance, 0),
      fixedAssets: fixedAssetsList.reduce((s,c) => s + c.balance, 0),
      equityOpening: equityList.reduce((s,c) => s + c.balance, 0),
      expenseCats, revenueCats, receivablesList, payablesList, fixedAssetsList, equityList
    };
  };

  const fin = calculateFinancials();

  const handleSaveOpeningEntry = () => {
    if (!openingEntryForm.accountName) return;
    const newEntry = { ...openingEntryForm, id: crypto.randomUUID() } as OpeningEntry;
    const updated = [newEntry, ...openingEntries];
    localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
    setIsAddingEntry(false);
    setOpeningEntryForm({ accountName: '', accountType: 'أصول', debit: 0, credit: 0, date: new Date().toISOString().split('T')[0], notes: '' });
    loadData();
  };

  const handleSavePeriodicInventory = () => {
    if (tempInvItems.length === 0) return;
    const totalValue = tempInvItems.reduce((s, c) => s + c.total, 0);
    const invId = crypto.randomUUID();
    const date = new Date().toISOString().split('T')[0];

    const newInv: PeriodicInventory = { id: invId, date, type: 'OPENING', items: tempInvItems, totalValue, notes: 'جرد بضاعة أول المدة تفصيلي' };
    localStorage.setItem('sheno_periodic_inventories', JSON.stringify([newInv, ...inventories]));

    const newStockEntries: StockEntry[] = tempInvItems.map(it => ({
        id: crypto.randomUUID(), date, day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date()),
        department: 'قيد افتتاح مخزني', itemCode: it.itemCode, itemName: it.itemName, unit: 'قطعة', price: it.price,
        warehouse: it.warehouse, movementType: 'إدخال', quantity: it.quantity, invoiceNumber: 'INIT-INV',
        statement: `رصيد أول مدة - ${it.notes || 'جرد دوري'}`, movementCode: invId
    }));
    localStorage.setItem('sheno_stock_entries', JSON.stringify([...newStockEntries, ...stockEntries]));

    setIsAddingInventory(false);
    setTempInvItems([]);
    loadData();
  };

  const renderDetailTable = (data: { name: string; balance: number }[]) => {
    if (data.length === 0) return null;
    return (
      <div className={`mt-3 overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl animate-in slide-in-from-top-2 duration-300 bg-white dark:bg-zinc-950 ${!showDetailsInPrint ? 'no-print' : ''}`}>
        <table className="w-full text-right text-[10px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
            <tr className="text-zinc-500 font-black">
              <th className="p-2 border-l dark:border-zinc-800">البيان / الحساب</th>
              <th className="p-2 text-center">الرصيد الجاري</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="p-2 border-l dark:border-zinc-800 font-bold">{item.name}</td>
                <td className="p-2 text-center font-mono font-black">{item.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) newSet.delete(section);
    else newSet.add(section);
    setExpandedSections(newSet);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* UI Top Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
             <Landmark className="w-8 h-8 text-primary" />
             <div>
                <h2 className="text-2xl font-black text-readable">
                   {activeTab === 'REPORTS' ? (
                      reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' :
                      reportType === 'TRADING' ? 'حساب المتاجرة' : 'الأرباح والخسائر'
                   ) : activeTab === 'OPENING_ENTRY' ? 'القيود الافتتاحية' : 
                       activeTab === 'CHART_OF_ACCOUNTS' ? 'دليل الحسابات' : 'إدارة الجرد الدوري'}
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">المركز المحاسبي والختامي</p>
             </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           {activeTab === 'OPENING_ENTRY' && (
             <button onClick={() => setIsAddingEntry(true)} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
                <Plus className="w-5 h-5" /> إضافة قيد افتتاحي
             </button>
           )}
           {activeTab === 'INVENTORY_TOOLS' && (
             <button onClick={() => setIsAddingInventory(true)} className="bg-emerald-600 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
                <Plus className="w-5 h-5" /> تسجيل جرد بضاعة أول المدة
             </button>
           )}
           {activeTab === 'REPORTS' && (
             <button onClick={() => setShowDetailsInPrint(!showDetailsInPrint)} className={`px-4 py-2.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-md ${showDetailsInPrint ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500 border'}`}>
                  {showDetailsInPrint ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="hidden md:inline">{showDetailsInPrint ? 'التفاصيل مفعّلة في الطباعة' : 'إظهار التفاصيل في الطباعة'}</span>
             </button>
           )}
           <button onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Financial_Report')} className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg">
              <ImageIcon className="w-5 h-5" /> حفظ كصورة
           </button>
           <button onClick={() => window.print()} className="bg-rose-900 text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Printer className="w-5 h-5" /> طباعة
           </button>
        </div>
      </div>

      {!isSingleView && (
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 no-print">
           <button onClick={() => setActiveTab('REPORTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'REPORTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <PieChart className="w-5 h-5" /> التقارير الختامية
           </button>
           <button onClick={() => setActiveTab('CHART_OF_ACCOUNTS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'CHART_OF_ACCOUNTS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <ListTree className="w-5 h-5" /> دليل الحسابات
           </button>
           <button onClick={() => setActiveTab('OPENING_ENTRY')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'OPENING_ENTRY' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <Scale className="w-5 h-5" /> القيد الافتتاحي
           </button>
           <button onClick={() => setActiveTab('INVENTORY_TOOLS')} className={`flex-1 py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'INVENTORY_TOOLS' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}>
              <Package className="w-5 h-5" /> الجرد الدوري
           </button>
        </div>
      )}

      {activeTab === 'CHART_OF_ACCOUNTS' ? (
         <ChartOfAccountsView />
      ) : activeTab === 'INVENTORY_TOOLS' ? (
         <PeriodicInventoryManager 
            inventories={inventories} 
            closingStockValue={fin.closingStockValue} 
            closingStockItems={fin.closingStockItems}
            onDelete={(id) => {
               if(window.confirm('حذف هذا الجرد؟')) {
                  const updated = inventories.filter(x => x.id !== id);
                  localStorage.setItem('sheno_periodic_inventories', JSON.stringify(updated));
                  loadData();
               }
            }} 
         />
      ) : activeTab === 'OPENING_ENTRY' ? (
         <OpeningEntriesManager openingEntries={openingEntries} onDelete={(id) => {
            if(window.confirm('حذف هذا القيد؟')) {
               const updated = openingEntries.filter(x => x.id !== id);
               localStorage.setItem('sheno_opening_entries', JSON.stringify(updated));
               loadData();
            }
         }} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {!isSingleView && (
          <div className="lg:col-span-1 space-y-6 no-print">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-3">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b pb-2 mb-4">اختر نوع التقرير الختامي</h3>
                  <button onClick={() => setReportType('BALANCE_SHEET')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'BALANCE_SHEET' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>الميزانية العمومية</button>
                  <button onClick={() => setReportType('TRADING')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'TRADING' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>حساب المتاجرة</button>
                  <button onClick={() => setReportType('INCOME_STATEMENT')} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition-all border ${reportType === 'INCOME_STATEMENT' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500'}`}>قائمة الأرباح والخسائر</button>
              </div>
          </div>
        )}

        <div className={isSingleView ? "lg:col-span-4" : "lg:col-span-3"}>
           {/* فلترة التاريخ */}
           <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between no-print mb-6">
              <div className="flex items-center gap-6">
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase mr-1">نطاق التقرير الزمني</span>
                    <div className="flex items-center gap-3">
                       <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs font-mono outline-none" />
                       <span className="text-slate-700 font-black">←</span>
                       <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs font-mono outline-none" />
                    </div>
                 </div>
              </div>
           </div>

           <div ref={reportRef} className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl export-fix">
              {/* ترويسة التقرير (ثابتة في الطباعة) */}
              <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 text-zinc-900 dark:text-white">
                 <div className="flex items-center gap-4">
                    {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl">SH</div>}
                    <div><h1 className="text-xl font-black">{settings?.companyName}</h1><p className="text-[10px] text-zinc-400 font-black uppercase mt-1">{settings?.companyType}</p></div>
                 </div>
                 <div className="text-center">
                    <h2 className="text-2xl font-black underline decoration-primary/20 underline-offset-8">
                       {reportType === 'BALANCE_SHEET' ? 'الميزانية العمومية' : reportType === 'INCOME_STATEMENT' ? 'قائمة الأرباح والخسائر' : 'حساب المتاجرة'}
                    </h2>
                    <p className="text-[10px] mt-4 font-bold text-zinc-400 uppercase tracking-widest">الفترة من: {startDate} إلى: {endDate}</p>
                 </div>
                 <div className="text-left text-[10px] font-black text-zinc-400">
                    <p>{settings?.address}</p><p dir="ltr">{settings?.phone}</p>
                 </div>
              </div>

              {/* استدعاء المكونات المقسمة حسب التبويب */}
              {reportType === 'BALANCE_SHEET' && (
                 <BalanceSheetReport 
                    fin={fin} 
                    expandedSections={expandedSections} 
                    toggleSection={toggleSection} 
                    renderDetailTable={renderDetailTable} 
                 />
              )}
              {reportType === 'TRADING' && (
                 <TradingAccountReport 
                    fin={fin} 
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                 />
              )}
              {reportType === 'INCOME_STATEMENT' && (
                 <IncomeStatementReport 
                    fin={fin} 
                    settings={settings}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                 />
              )}
           </div>
        </div>
      </div>
      )}

      {/* Modals: (كما كانت) */}
      {isAddingEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-8 space-y-8">
                 <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-5">
                    <div className="flex items-center gap-4"><h3 className="text-2xl font-black">تسجيل قيد افتتاحي جديد</h3></div>
                    <button onClick={() => setIsAddingEntry(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all"><X className="w-6 h-6 text-zinc-400" /></button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">الحساب</label>
                       <select value={openingEntryForm.accountName} onChange={e => setOpeningEntryForm({...openingEntryForm, accountName: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black outline-none w-full appearance-none cursor-pointer">
                          <option value="">-- اختر الحساب --</option>
                          <optgroup label="شجرة الحسابات">
                            {chartAccounts.filter(a => a.type === 'ACCOUNT').map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                          </optgroup>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">التصنيف</label>
                       <select className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black outline-none" value={openingEntryForm.accountType} onChange={e => setOpeningEntryForm({...openingEntryForm, accountType: e.target.value as any})}>
                          <option value="أصول">أصول (موجودات)</option>
                          <option value="خصوم">خصوم (مطاليب)</option>
                          <option value="حقوق ملكية">حقوق ملكية</option>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">مدين (+)</label>
                       <input type="number" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-emerald-100 p-4 rounded-2xl font-mono font-black text-2xl text-emerald-600 text-center outline-none" value={openingEntryForm.debit} onChange={e => setOpeningEntryForm({...openingEntryForm, debit: Number(e.target.value)})} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest">دائن (-)</label>
                       <input type="number" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-rose-100 p-4 rounded-2xl font-mono font-black text-2xl text-rose-600 text-center outline-none" value={openingEntryForm.credit} onChange={e => setOpeningEntryForm({...openingEntryForm, credit: Number(e.target.value)})} />
                    </div>
                 </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 flex justify-end gap-3 border-t dark:border-zinc-800">
                 <button onClick={handleSaveOpeningEntry} className="bg-primary text-white px-16 py-4 rounded-2xl font-black shadow-xl text-lg flex items-center gap-3"><Save className="w-6 h-6" /> تثبيت القيد</button>
              </div>
           </div>
        </div>
      )}

      {isAddingInventory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center">
                 <h3 className="text-2xl font-black">تسجيل جرد بضاعة أول المدة</h3>
                 <button onClick={() => {setIsAddingInventory(false); setTempInvItems([]);}} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-[2rem] border-2 border-dashed dark:border-zinc-800">
                    <div className="md:col-span-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase">الصنف</label>
                       <select value={invItemForm.itemCode} onChange={e => {
                          const item = inventoryList.find(i => i.code === e.target.value);
                          if(item) setInvItemForm({...invItemForm, itemCode: item.code, itemName: item.name, price: item.price});
                       }} className="w-full bg-white dark:bg-zinc-900 border p-3 rounded-xl font-bold">
                          <option value="">-- اختر مادة --</option>
                          {inventoryList.map(i => <option key={i.id} value={i.code}>{i.name}</option>)}
                       </select>
                    </div>
                    <div><input type="number" placeholder="كمية" className="w-full bg-white dark:bg-zinc-900 border p-3 rounded-xl mt-6" value={invItemForm.quantity} onChange={e => setInvItemForm({...invItemForm, quantity: Number(e.target.value)})} /></div>
                    <div><input type="number" placeholder="سعر" className="w-full bg-white dark:bg-zinc-900 border p-3 rounded-xl mt-6" value={invItemForm.price} onChange={e => setInvItemForm({...invItemForm, price: Number(e.target.value)})} /></div>
                    <div className="flex items-end"><button onClick={() => {
                        if (!invItemForm.itemCode || !invItemForm.quantity) return;
                        setTempInvItems([...tempInvItems, { ...invItemForm, total: invItemForm.quantity * invItemForm.price }]);
                        setInvItemForm({ itemCode: '', itemName: '', quantity: 0, price: 0, warehouse: 'المستودع الرئيسي', notes: '' });
                    }} className="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-black">إضافة</button></div>
                 </div>
                 <div className="border rounded-2xl overflow-hidden">
                    <table className="w-full text-right">
                       <thead className="bg-zinc-900 text-white text-[10px] font-black uppercase"><tr><th className="p-3">المادة</th><th className="p-3 text-center">الكمية</th><th className="p-3 text-center">السعر</th><th className="p-3 text-center">الإجمالي</th></tr></thead>
                       <tbody className="divide-y font-bold">
                          {tempInvItems.map((it, idx) => (
                             <tr key={idx} className="h-12"><td className="p-3">{it.itemName}</td><td className="p-3 text-center font-mono">{it.quantity.toLocaleString()}</td><td className="p-3 text-center font-mono">{it.price.toLocaleString()}</td><td className="p-3 text-center font-mono text-emerald-600">{it.total.toLocaleString()}</td></tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
              <div className="p-8 bg-zinc-900 text-white flex justify-between items-center">
                 <button onClick={handleSavePeriodicInventory} className="bg-primary text-white px-20 py-5 rounded-2xl font-black text-xl">تثبيت الجرد</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountingCenterView;
