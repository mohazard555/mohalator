import React, { useState, useEffect } from 'react';
import { MENU_GROUPS } from '../constants';
import { AppView, AppSettings, SalesInvoice, PurchaseInvoice, CashEntry, InventoryItem, StockEntry, PeriodicInventory } from '../types';

interface DashboardProps {
  setView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    dailyReceipts: 0,
    cashBalance: 0,
    totalPurchases: 0,
    inventoryValue: 0,
    netProfit: 0
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('sheno_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const sSales = localStorage.getItem('sheno_sales_invoices');
    const sReturns = localStorage.getItem('sheno_sales_returns');
    const sPurchases = localStorage.getItem('sheno_purchases');
    const sJournal = localStorage.getItem('sheno_cash_journal');
    const sInventoryList = localStorage.getItem('sheno_inventory_list');
    const sStockMoves = localStorage.getItem('sheno_stock_entries');
    const sPeriodic = localStorage.getItem('sheno_periodic_inventories');

    const sales: SalesInvoice[] = sSales ? JSON.parse(sSales) : [];
    const returns: any[] = sReturns ? JSON.parse(sReturns) : [];
    const purchases: PurchaseInvoice[] = sPurchases ? JSON.parse(sPurchases) : [];
    const journal: CashEntry[] = sJournal ? JSON.parse(sJournal) : [];
    const inventoryList: InventoryItem[] = sInventoryList ? JSON.parse(sInventoryList) : [];
    const stockMoves: StockEntry[] = sStockMoves ? JSON.parse(sStockMoves) : [];
    const periodic: PeriodicInventory[] = sPeriodic ? JSON.parse(sPeriodic) : [];

    // 1. إجمالي المبيعات = مجموع بنود الفواتير (Gross)
    const grossSales = sales.reduce((s, c) => s + c.items.reduce((sum, it) => sum + it.total, 0), 0);
    
    // 2. صافي المبيعات (لاحتساب الربح) = الإجمالي - المرتجع - الحسم الممنوح
    const totalReturns = returns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0);
    const totalDiscounts = sales.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0);
    const netSales = grossSales - totalReturns - totalDiscounts;

    // 3. إجمالي المشتريات
    const totalPurchases = purchases.reduce((s, c) => s + c.items.reduce((sum, it) => sum + it.total, 0), 0);

    // 4. قيمة مواد المخزن (الجرد الحالي)
    const inventoryValue = inventoryList.reduce((sum, item) => {
      const moves = stockMoves.filter(m => m.itemCode === item.code);
      const added = moves.filter(m => m.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
      const issued = moves.filter(m => m.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
      const returned = moves.filter(m => m.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
      const balance = (Number(item.openingStock) || 0) + added - issued + returned;
      return sum + (balance * (Number(item.price) || 0));
    }, 0);

    // 5. صافي الربح
    const openingStockVal = periodic.find(i => i.type === 'OPENING')?.totalValue || 0;
    const cogs = openingStockVal + totalPurchases - inventoryValue;
    const grossProfit = netSales - cogs;
    const expenses = journal.filter(j => j.paidSYP > 0 && !j.statement.includes('شراء')).reduce((s, c) => s + c.paidSYP, 0);
    const netProfit = grossProfit - expenses;

    setStats({
      totalSales: grossSales,
      dailyReceipts: journal.filter(j => j.date === new Date().toISOString().split('T')[0]).reduce((s, c) => s + c.receivedSYP, 0),
      cashBalance: journal.reduce((s, c) => s + (c.receivedSYP - c.paidSYP), 0),
      totalPurchases,
      inventoryValue,
      netProfit
    });
  }, []);

  const boxes = [
    { label: 'إجمالي مبيعات المنشأة', val: stats.totalSales, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    { label: 'إجمالي المشتريات (Gross)', val: stats.totalPurchases, color: 'text-amber-500', bg: 'bg-amber-500/5' },
    { label: 'قيمة بضاعة المخزن', val: stats.inventoryValue, color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { label: 'صافي الربح المحقق', val: stats.netProfit, color: 'text-rose-500', bg: 'bg-rose-500/5' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {MENU_GROUPS.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 shadow-xl flex items-center justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-primary opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"></div>
              <h2 className="text-lg font-black text-white z-10">{group.title}</h2>
              <div className="text-primary z-10">{group.icon}</div>
            </div>
            
            <div className="grid gap-2">
              {group.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setView(item.view)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-right transition-all duration-200 hover:border-primary group flex items-center justify-between shadow-sm hover:shadow-md"
                >
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-primary">{item.label}</span>
                  <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-primary text-xs">←</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {boxes.map((st, i) => (
          <div key={i} className={`${st.bg} p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col items-center text-center gap-3 group hover:scale-[1.03] transition-all hover:shadow-2xl`}>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{st.label}</span>
            <span className={`text-4xl font-mono font-black ${st.color} tracking-tighter`}>{st.val.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;