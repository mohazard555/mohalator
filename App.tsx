
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, LogOut, FileOutput, Heart, Info, Bell, TrendingUp, Phone, UserCheck } from 'lucide-react';
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
            <div className="flex items-center gap-2