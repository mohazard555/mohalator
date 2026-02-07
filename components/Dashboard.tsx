
import React, { useState, useEffect } from 'react';
import { MENU_GROUPS } from '../constants';
import { AppView, AppSettings, SalesInvoice, PurchaseInvoice, CashEntry, InventoryItem, StockEntry } from '../types';

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

    // استخراج البيانات للحسابات الدقيقة
    const sSales = localStorage.getItem('sheno_sales_invoices');
    const sPurchases = localStorage.getItem('sheno_purchases');
    const sJournal = localStorage.getItem('sheno_cash_journal');
    const sInventory = localStorage.getItem('sheno_inventory_list');
    const sStockMoves = localStorage.getItem('sheno_stock_entries');

    const sales: SalesInvoice[] = sSales ? JSON.parse(sSales) : [];
    const purchases: PurchaseInvoice[] = sPurchases ? JSON.parse(sPurchases) : [];
    const journal: CashEntry[] = sJournal ? JSON.parse(sJournal) : [];
    const inventory: InventoryItem[] = sInventory ? JSON.parse(sInventory) : [];
    const stockMoves: StockEntry[] = sStockMoves ? JSON.parse(sStockMoves) : [];

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. إجمالي المبيعات
    const totalSales = sales.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0);
    
    // 2. إجمالي المشتريات
    const totalPurchases = purchases.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0);

    // 3. مقبوضات اليوم (ليرة سورية ودولار محول)
    const dailyReceipts = journal
      .filter(j => j.date === todayStr)
      .reduce((s, c) => s + (Number(c.receivedSYP) || 0) + (Number(c.receivedUSD) * 15000 || 0), 0); // تقدير صرف 15000 للملخص السريع

    // 4. رصيد الصندوق الحالي (صافي ليرة سورية)
    const cashBalance = journal.reduce((s, c) => s + ((Number(c.receivedSYP) || 0) - (Number(c.paidSYP) || 0)), 0);

    // 5. إجمالي قيمة المخزون (الجرد الحالي)
    const inventoryValue = inventory.reduce((sum, item) => {
      const itemMoves = stockMoves.filter(m => m.itemCode === item.code);
      const added = itemMoves.filter(m => m.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
      const issued = itemMoves.filter(m => m.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
      const returned = itemMoves.filter(m => m.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
      const currentBalance = (Number(item.openingStock) || 0) + added - issued + returned;
      return sum + (currentBalance * (Number(item.price) || 0));
    }, 0);

    // 6. صافي الربح التقديري (مبيعات - مشتريات - مصاريف من اليومية)
    const expenses = journal
      .filter(j => j.type === 'دفع' || j.statement.includes('مصاريف'))
      .reduce((s, c) => s + (Number(c.paidSYP) || 0), 0);
    const netProfit = totalSales - totalPurchases - expenses;

    setStats({
      totalSales,
      dailyReceipts,
      cashBalance,
      totalPurchases,
      inventoryValue,
      netProfit
    });
  }, []);

  const boxes = [
    { label: 'إجمالي المبيعات العامة', val: stats.totalSales, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    { label: 'إجمالي المشتريات', val: stats.totalPurchases, color: 'text-amber-500', bg: 'bg-amber-500/5' },
    { label: 'قيمة بضاعة المخزن', val: stats.inventoryValue, color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { label: 'مقبوضات اليوم', val: stats.dailyReceipts, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'رصيد الصندوق النقدي', val: stats.cashBalance, color: 'text-zinc-400', bg: 'bg-zinc-500/5' },
    { label: 'صافي الأرباح المحققة', val: stats.netProfit, color: 'text-rose-500', bg: 'bg-rose-500/5' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boxes.map((st, i) => (
          <div key={i} className={`${st.bg} p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center gap-2 group hover:scale-[1.02] transition-transform`}>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{st.label} ({settings?.currencySymbol})</span>
            <span className={`text-4xl font-mono font-black ${st.color}`}>{st.val.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
