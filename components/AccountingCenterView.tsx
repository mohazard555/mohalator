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
import PeriodicInventoryManager from './PeriodicInventoryManager';

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

    // المبيعات: إجمالي - مرتجع - حسم
    const grossSalesVal = safeRound(filteredSales.reduce((s, c) => s + (c.items.reduce((sum, it) => sum + it.total, 0)), 0));
    const salesReturnsVal = safeRound(filteredSalesReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const salesDiscountsVal = safeRound(filteredSales.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netSales = safeRound(grossSalesVal - (salesReturnsVal + salesDiscountsVal));

    // المشتريات: (إجمالي + نقل) - (مرتجع + حسم مكتسب)
    const grossPurchasesVal = safeRound(filteredPurchases.reduce((s, c) => s + (c.items.reduce((sum, it) => sum + it.total, 0)), 0));
    const purchaseTransport = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.transportExpenses) || 0), 0));
    const purchaseReturnsVal = safeRound(filteredPurchaseReturns.reduce((s, c) => s + (Number(c.totalReturnAmount) || 0), 0));
    const purchaseDiscountsVal = safeRound(filteredPurchases.reduce((s, c) => s + (Number(c.discountAmount) || 0), 0));
    const netPurchases = safeRound((grossPurchasesVal + purchaseTransport) - (purchaseReturnsVal + purchaseDiscountsVal));

    // المخزون
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

    // المتاجرة
    const cogs = safeRound(openingStockValue + netPurchases - closingStockValue);
    const grossProfit = safeRound(netSales - cogs);

    // الأرباح والخسائر: تضمين الحسم كبنود تشغيلية في حال النقد
    const expenseCats = categories.filter(c => c.type === 'مصروفات').map(cat => ({
      id: cat.id, name: cat.name,
      total: safeRound(filteredJournal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + (c.paidSYP || 0), 0))
    })).filter(c => c.total > 0);

    const revenueCats = categories.filter(c => c.type === 'إيرادات').map(cat => ({
      id: cat.id, name: cat.name,
      total: safeRound(filteredJournal.filter(j => j.categoryId === cat.id).reduce((s, c) => s + (c.receivedSYP || 0), 0))
    })).filter(c => c.total > 0);

    // حساب الحسم المحقق نقداً
    const cashSalesDiscount = safeRound(filteredSales.filter(s => s.paymentType === 'نقداً').reduce((s, c) => s + (c.discountAmount || 0), 0));
    const cashPurchaseDiscount = safeRound(filteredPurchases.filter(p => p.paymentType === 'نقداً').reduce((s, c) => s + (c.discountAmount || 0), 0));

    // إجمالي المصاريف تشمل الحسم الممنوح النقدي
    const totalExpenses = safeRound(expenseCats.reduce((s, c) => s + c.total, 0) + cashSalesDiscount);
    // إجمالي الإيرادات تشمل الحسم المكتسب النقدي
    const totalOtherRevenues = safeRound(revenueCats.reduce((s, c) => s + c.total, 0) + cashPurchaseDiscount);
    
    const netProfit = safeRound((grossProfit + totalOtherRevenues) - totalExpenses);

    return { 
      grossSalesVal, netSales, salesReturnsVal, salesDiscountsVal,
      grossPurchasesVal, netPurchases, purchaseTransport, purchaseReturnsVal, purchaseDiscountsVal,
      cogs, grossProfit, netProfit, 
      openingStockValue, openingStockItems: openingStockInv?.items || [], 
      closingStockValue, closingStockItems, 
      cashInHand: safeRound(journal.filter(j => j.date <= endDate).reduce((s, c) => s + (c.receivedSYP - c.paidSYP), 0)), 
      receivables: 0, payables: 0, fixedAssets: 0, equityOpening: 0, // Placeholder
      expenseCats, revenueCats, cashSalesDiscount, cashPurchaseDiscount,
      totalExpenses, totalOtherRevenues,
      purchaseItems: filteredPurchases.flatMap(p => p.items.map(i => ({ ...i, supplier: p.supplierName, invoice: p.invoiceNumber }))),
      saleItems: filteredSales.flatMap(s => s.items.map(i => ({ ...i, customer: s.customerName, invoice: s.invoiceNumber })))
    };
  };

  const fin = calculateFinancials();

  return (
    <div className="space-y-6 animate-in fade-in">
       {/* UI Logic follows... */}
       <div ref={reportRef} className="bg-white p-10 rounded-[2.5rem] shadow-2xl export-fix">
          {reportType === 'INCOME_STATEMENT' && <IncomeStatementReport fin={fin} settings={settings} expandedSections={expandedSections} toggleSection={(id) => { const n = new Set(expandedSections); if(n.has(id)) n.delete(id); else n.add(id); setExpandedSections(n); }} />}
          {reportType === 'TRADING' && <TradingAccountReport fin={fin} expandedSections={expandedSections} toggleSection={(id) => { const n = new Set(expandedSections); if(n.has(id)) n.delete(id); else n.add(id); setExpandedSections(n); }} />}
          {reportType === 'BALANCE_SHEET' && <BalanceSheetReport fin={fin} expandedSections={expandedSections} toggleSection={(id) => { const n = new Set(expandedSections); if(n.has(id)) n.delete(id); else n.add(id); setExpandedSections(n); }} renderDetailTable={() => null} />}
       </div>
    </div>
  );
};

export default AccountingCenterView;