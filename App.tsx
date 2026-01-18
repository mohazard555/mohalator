


import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, Calendar, Clock, UserCircle, Moon, Sun, Settings as SettingsIcon, Archive, FileOutput } from 'lucide-react';
import { AppView, AppSettings } from './types';
import Dashboard from './components/Dashboard';
import SalesInvoiceView from './components/SalesInvoiceView';
import InventoryView from './components/InventoryView';
import CashJournalView from './components/CashJournalView';
import CustomerBalancesView from './components/CustomerBalancesView';
import DailyBalancesView from './components/DailyBalancesView';
import ProfitLossReportView from './components/ProfitLossReportView';
import StockEntriesView from './components/StockEntriesView';
import ItemMovementView from './components/ItemMovementView';
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
import LoginView from './components/LoginView';
import ProfessionalInvoiceView from './components/ProfessionalInvoiceView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'شينو للمحاسبة',
    phone: '093XXXXXXX',
    address: 'دمشق، سوريا',
    primaryColor: '#e11d48',
    secondaryColor: '#881337',
    darkMode: true,
    language: 'ar',
    currency: 'ل.س',
    isLoginEnabled: false,
    username: 'admin',
    password: '',
    passwordHint: 'لا يوجد تلميح'
  });

  useEffect(() => {
    const saved = localStorage.getItem('sheno_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      if (!parsed.isLoginEnabled) setIsAuthenticated(true);
    } else {
      setIsAuthenticated(true);
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.documentElement.setAttribute('dir', settings.language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = settings.language;
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
  }, [settings]);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard setView={setCurrentView} />;
      case AppView.SALES_INVOICE: return <SalesInvoiceView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.PROFESSIONAL_INVOICE: return <ProfessionalInvoiceView onBack={() => setCurrentView(AppView.DASHBOARD)} settings={settings} />;
      case AppView.INVENTORY: return <InventoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.CASH_JOURNAL: return <CashJournalView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.CUSTOMER_BALANCES: return <CustomerBalancesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      // Fixed: Removed undefined CashFileView and used DailyBalancesView directly to resolve duplicate identifier and syntax errors
      case AppView.CASH_FILE: return <DailyBalancesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.REPORTS: return <ProfitLossReportView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.STOCK_ENTRIES: return <StockEntriesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.DETAILED_ITEM_MOVEMENT: return <DetailedItemMovementView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.SALES_RETURN: return <SalesReturnView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.PURCHASE_RETURN: return <PurchaseReturnView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.DETAILED_SALES_REPORT: return <DetailedSalesReportView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.RECEIPT_VOUCHER: return <VoucherListView onBack={() => setCurrentView(AppView.DASHBOARD)} type="قبض" />;
      case AppView.PAYMENT_VOUCHER: return <VoucherListView onBack={() => setCurrentView(AppView.DASHBOARD)} type="دفع" />;
      case AppView.PURCHASE_INVOICE: return <PurchaseInvoiceView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.PARTY_MANAGEMENT: return <PartyManagementView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.SETTINGS: return <SettingsView onBack={() => setCurrentView(AppView.DASHBOARD)} settings={settings} setSettings={setSettings} />;
      case AppView.WAREHOUSE_ANALYTICS: return <WarehouseAnalyticsView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.ARCHIVES: return <ArchivesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      default: return <Dashboard setView={setCurrentView} />;
    }
  };

  if (settings.isLoginEnabled && !isAuthenticated) {
    return <LoginView settings={settings} onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${settings.darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      <header className={`${settings.darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-b px-6 py-3 flex items-center justify-between sticky top-0 z-50`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView(AppView.DASHBOARD)}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black shadow-lg">SH</div>
            )}
            <span className="font-bold text-xl tracking-tight">{settings.companyName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView(AppView.PROFESSIONAL_INVOICE)} className="bg-zinc-800 text-zinc-400 p-2 rounded-xl hover:bg-primary hover:text-white transition-all" title="تصدير فاتورة">
             <FileOutput className="w-5 h-5" />
          </button>
          <button onClick={() => setSettings({...settings, darkMode: !settings.darkMode})} className={`p-2 rounded-xl ${settings.darkMode ? 'text-amber-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setCurrentView(AppView.SETTINGS)} className="p-2 hover:bg-zinc-800 rounded-xl"><SettingsIcon className="w-5 h-5" /></button>
          <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
            <UserCircle className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-bold">المدير العام</span>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 overflow-auto">{renderView()}</main>
    </div>
  );
};

export default App;