
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, LogOut, FileOutput, Heart, Info, Bell, TrendingUp } from 'lucide-react';
import { AppView, AppSettings, SalesInvoice } from './types';
import Dashboard from './components/Dashboard';
import SalesInvoiceView from './components/SalesInvoiceView';
import SalesHistoryView from './components/SalesHistoryView';
import SalesReturnHistoryView from './components/SalesReturnHistoryView';
import PurchaseHistoryView from './components/PurchaseHistoryView';
import PurchaseReturnHistoryView from './components/PurchaseReturnHistoryView';
import InventoryView from './components/InventoryView';
import CashJournalView from './components/CashJournalView';
import CustomerBalancesView from './components/CustomerBalancesView';
import DailyBalancesView from './components/DailyBalancesView';
import ProfitLossReportView from './components/ProfitLossReportView';
import StockEntriesView from './components/StockEntriesView';
import DetailedItemMovementView from './components/DetailedItemMovementView';
import SalesReturnView from './components/SalesReturnView';
import PurchaseReturnView from './components/PurchaseReturnView';
import DetailedSalesReportView from './components/DetailedSalesReportView';
import VoucherListView from './components/VoucherListView';
import PurchaseInvoiceView from './components/PurchaseInvoiceView';
import PartyManagementView from './components/PartyManagementView';
import SettingsView from './components/SettingsView';
import WarehouseAnalyticsView from './components/WarehouseAnalyticsView';
import WarehouseManagementView from './components/WarehouseManagementView';
import ArchivesView from './components/ArchivesView';
import ProfessionalInvoiceView from './components/ProfessionalInvoiceView';
import CustomerInvoiceCostsView from './components/CustomerInvoiceCostsView';
import InvestmentReportsView from './components/InvestmentReportsView';
import AccountingCategoriesView from './components/AccountingCategoriesView';
import GeneralLedgerView from './components/GeneralLedgerView';
import ChartOfAccountsView from './components/ChartOfAccountsView';
import LoginView from './components/LoginView';
import DollarBalancesView from './components/DollarBalancesView';
import InvoiceGalleryView from './components/InvoiceGalleryView';
import JournalEntryView from './components/JournalEntryView';

import BalanceSheetView from './components/BalanceSheetView';
import TradingAccountView from './components/TradingAccountView';
import IncomeStatementView from './components/IncomeStatementView';
import OpeningEntriesView from './components/OpeningEntriesView';
import PeriodicInventoryView from './components/PeriodicInventoryView';

const FinexaLogo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
    <rect width="48" height="48" rx="12" fill="url(#finexa_grad)" />
    <path d="M14 34V24M24 34V14M34 34V19" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="34" cy="14" r="3" fill="#10b981" />
    <defs>
      <linearGradient id="finexa_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e40af" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
    </defs>
  </svg>
);

const PHRASES = [
  "نبدأ من الأرقام… لنصل إلى القرارات الصحيحة.",
  "إدارة مالية دقيقة… تعني مستقبلًا أفضل.",
  "نرتّب حساباتك… لنرتّب أعمالك.",
  "كل رقم له قصة… ونحن نرويها بوضوح.",
  "تحكم كامل… رؤية أوضح.",
  "حلول محاسبية تبسط التعقيد.",
  "مع Finexa… الأرقام تعمل لصالحك.",
  "تقارير دقيقة… نتائج مؤكدة.",
  "حسابات متوازنة… أعمال متزنة.",
  "نحو إدارة مالية أكثر ذكاءً.",
  "نضع الدقة أولاً… في كل قيد.",
  "مؤشرات مالية تساعدك على النمو.",
  "تحليل أسرع… أداء أفضل.",
  "نسهّل المحاسبة… لتركّز على عملك.",
  "كل شيء يبدأ من ميزانية واضحة."
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [editingReturn, setEditingReturn] = useState<any | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'شركة فينيسكا للحلول الذكية',
    companyType: 'إدارة مالية ومحاسبية متكاملة',
    website: 'www.finexa.pro',
    managerName: 'مدير النظام',
    accountantName: 'المحاسب الرئيسي',
    logoUrl: '', 
    phone: '093XXXXXXX',
    address: 'سوريا',
    primaryColor: '#1e40af',
    secondaryColor: '#1e3a8a',
    darkMode: true,
    language: 'ar',
    currency: 'ليرة سورية',
    currencySymbol: 'ل.س',
    secondaryCurrency: 'دولار أمريكي',
    secondaryCurrencySymbol: '$',
    isLoginEnabled: true,
    username: 'admin',
    password: '123',
    passwordHint: 'كلمة المرور الافتراضية هي 123'
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      if (!parsed.isLoginEnabled) setIsAuthenticated(true);
    } else {
      if (!settings.isLoginEnabled) setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.documentElement.setAttribute('dir', settings.language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = settings.language;
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
  }, [settings]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView(AppView.DASHBOARD);
  };

  if (settings.isLoginEnabled && !isAuthenticated) {
    return <LoginView settings={settings} onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 print:bg-white print:text-black ${settings.darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      
      <div className="no-print bg-primary/5 border-b border-primary/10 py-2.5 overflow-hidden sticky top-0 z-[60] backdrop-blur-xl">
        <div className="flex animate-ticker whitespace-nowrap gap-24">
          {PHRASES.map((phrase, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(30,64,175,0.8)] animate-pulse"></div>
              <span className="text-[11px] font-black text-primary/90 tracking-wide">{phrase}</span>
            </div>
          ))}
          {PHRASES.map((phrase, i) => (
            <div key={`dup-${i}`} className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(30,64,175,0.8)] animate-pulse"></div>
              <span className="text-[11px] font-black text-primary/90 tracking-wide">{phrase}</span>
            </div>
          ))}
        </div>
      </div>

      <header className={`${settings.darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-b px-6 py-2 flex items-center justify-between sticky top-[42px] z-50 no-print shadow-sm backdrop-blur-md bg-opacity-90`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView(AppView.DASHBOARD)}>
            <FinexaLogo />
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-blue-600 dark:text-blue-500 leading-none group-hover:tracking-normal transition-all duration-300">Finexa</span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-[0.4em] -mt-0.5">Intelligence</span>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-black opacity-30 uppercase tracking-widest leading-none mb-1">المؤسسة النشطة</span>
            <div className="flex items-center gap-2">
              {settings.logoUrl && <img src={settings.logoUrl} className="w-5 h-5 object-contain" alt="Entity" />}
              <span className="font-black text-sm text-readable opacity-90">{settings.companyName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 border-l dark:border-zinc-800 pl-4 ml-2">
            <button onClick={() => setCurrentView(AppView.PROFESSIONAL_INVOICE)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-primary p-2.5 rounded-xl transition-all shadow-inner" title="تصدير فاتورة احترافية"><FileOutput className="w-6 h-6" /></button>
            <button onClick={() => setCurrentView(AppView.SETTINGS)} className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all" title="إعدادات النظام"><SettingsIcon className="w-6 h-6" /></button>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button onClick={handleLogout} className="flex items-center gap-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm border border-rose-500/20 shadow-sm"><LogOut className="w-4 h-4" /><span className="hidden md:inline">خروج</span></button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-auto pb-24 print:p-0 print:bg-white">
        {(() => {
          switch (currentView) {
            case AppView.DASHBOARD: return <Dashboard setView={setCurrentView} />;
            case AppView.SALES_INVOICE: return <SalesInvoiceView onBack={() => { setEditingInvoice(null); setCurrentView(AppView.DASHBOARD); }} initialInvoice={editingInvoice || undefined} />;
            case AppView.SALES_HISTORY: return <SalesHistoryView onBack={() => setCurrentView(AppView.DASHBOARD)} onEdit={(inv) => { setEditingInvoice(inv); setCurrentView(AppView.SALES_INVOICE); }} />;
            case AppView.SALES_RETURN_HISTORY: return <SalesReturnHistoryView onBack={() => setCurrentView(AppView.DASHBOARD)} onEdit={(ret) => { setEditingReturn(ret); setCurrentView(AppView.SALES_RETURN); }} />;
            case AppView.PURCHASE_HISTORY: return <PurchaseHistoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.PURCHASE_RETURN_HISTORY: return <PurchaseReturnHistoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.PROFESSIONAL_INVOICE: return <ProfessionalInvoiceView onBack={() => setCurrentView(AppView.DASHBOARD)} settings={settings} />;
            case AppView.INVENTORY: return <InventoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CASH_JOURNAL: return <CashJournalView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CUSTOMER_BALANCES: return <CustomerBalancesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CASH_FILE: return <DailyBalancesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.STOCK_ENTRIES: return <StockEntriesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.DETAILED_ITEM_MOVEMENT: return <DetailedItemMovementView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CUSTOMER_INVOICE_COSTS: return <CustomerInvoiceCostsView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.SALES_RETURN: return <SalesReturnView onBack={() => { setEditingReturn(null); setCurrentView(AppView.DASHBOARD); }} initialReturn={editingReturn || undefined} />;
            case AppView.PURCHASE_RETURN: return <PurchaseReturnView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.DETAILED_SALES_REPORT: return <DetailedSalesReportView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.RECEIPT_VOUCHER: return <VoucherListView onBack={() => setCurrentView(AppView.DASHBOARD)} type="قبض" />;
            case AppView.PAYMENT_VOUCHER: return <VoucherListView onBack={() => setCurrentView(AppView.DASHBOARD)} type="دفع" />;
            case AppView.PURCHASE_INVOICE: return <PurchaseInvoiceView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.PARTY_MANAGEMENT: return <PartyManagementView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.SETTINGS: return <SettingsView onBack={() => setCurrentView(AppView.DASHBOARD)} settings={settings} setSettings={setSettings} />;
            case AppView.WAREHOUSE_ANALYTICS: return <WarehouseAnalyticsView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.WAREHOUSE_MANAGEMENT: return <WarehouseManagementView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.ARCHIVES: return <ArchivesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.INVESTMENT_REPORTS: return <InvestmentReportsView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.ACCOUNTING_CATEGORIES: return <AccountingCategoriesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.GENERAL_LEDGER: return <GeneralLedgerView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.DOLLAR_BALANCES: return <DollarBalancesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.INVOICE_GALLERY: return <InvoiceGalleryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.JOURNAL_ENTRY: return <JournalEntryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            
            case AppView.CHART_OF_ACCOUNTS: return <ChartOfAccountsView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.BALANCE_SHEET: return <BalanceSheetView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.TRADING_ACCOUNT: return <TradingAccountView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.INCOME_STATEMENT: return <IncomeStatementView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.OPENING_ENTRIES: return <OpeningEntriesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.PERIODIC_INVENTORY: return <PeriodicInventoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            
            default: return <Dashboard setView={setCurrentView} />;
          }
        })()}
      </main>

      <footer className="no-print mt-auto py-6 px-8 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
            <span>© 2026</span>
            <span className="text-blue-600 dark:text-blue-400 font-black">Finexa Intelligence</span>
            <span>جميع الحقوق محفوظة</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-200/50 dark:bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Powered By</span>
            <div className="w-px h-3 bg-zinc-400/30 mx-1"></div>
            <span className="text-xs font-black text-zinc-600 dark:text-zinc-300">FINEXA CORE ENGINE</span>
            <Heart className="w-3 h-3 text-blue-600 fill-blue-600 animate-pulse" />
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(30%); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker { animation: ticker 120s linear infinite; }
        .animate-ticker:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
};

export default App;
