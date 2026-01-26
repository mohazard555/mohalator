
import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings as SettingsIcon, LogOut, FileOutput, Heart } from 'lucide-react';
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
import LoginView from './components/LoginView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'SAMLATOR2026',
    companyType: 'نظام إدارة محاسبية متطور',
    website: 'www.samlator.pro',
    managerName: 'مهند أحمد',
    accountantName: 'المحاسب الرئيسي',
    phone: '093XXXXXXX',
    address: 'سوريا',
    primaryColor: '#e11d48',
    secondaryColor: '#881337',
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
      if (parsed.companyName === 'شينو للمحاسبة' || !parsed.companyName) parsed.companyName = 'SAMLATOR2026';
      if (parsed.password === '' || parsed.password === undefined) parsed.password = '123';
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

  const handleEditFromHistory = (invoice: SalesInvoice) => {
    setEditingInvoice(invoice);
    setCurrentView(AppView.SALES_INVOICE);
  };

  if (settings.isLoginEnabled && !isAuthenticated) {
    return <LoginView settings={settings} onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${settings.darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      <header className={`${settings.darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-b px-6 py-3 flex items-center justify-between sticky top-0 z-50 no-print shadow-sm`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setEditingInvoice(null); setCurrentView(AppView.DASHBOARD); }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black shadow-lg">
                {settings.companyName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-black text-xl tracking-tight text-primary">{settings.companyName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 border-l dark:border-zinc-800 pl-4 ml-2">
            <button 
              onClick={() => setCurrentView(AppView.PROFESSIONAL_INVOICE)} 
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-primary p-2.5 rounded-xl transition-all" 
              title="تصدير فاتورة احترافية"
            >
               <FileOutput className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setSettings({...settings, darkMode: !settings.darkMode})} 
              className={`p-2.5 rounded-xl transition-all ${settings.darkMode ? 'text-amber-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}
              title="تغيير المظهر"
            >
              {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setCurrentView(AppView.SETTINGS)} 
              className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all" 
              title="إعدادات النظام"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-xl transition-all font-bold text-sm" 
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">خروج</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full border dark:border-zinc-700 shadow-inner">
              <span className="text-xs font-black opacity-70">{settings.managerName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-auto pb-24">
        {(() => {
          switch (currentView) {
            case AppView.DASHBOARD: return <Dashboard setView={setCurrentView} />;
            case AppView.SALES_INVOICE: return (
              <SalesInvoiceView 
                onBack={() => { setEditingInvoice(null); setCurrentView(AppView.DASHBOARD); }} 
                initialInvoice={editingInvoice || undefined}
              />
            );
            case AppView.SALES_HISTORY: return (
              <SalesHistoryView 
                onBack={() => setCurrentView(AppView.DASHBOARD)} 
                onEdit={handleEditFromHistory}
              />
            );
            case AppView.SALES_RETURN_HISTORY: return (
              <SalesReturnHistoryView 
                onBack={() => setCurrentView(AppView.DASHBOARD)} 
                onEdit={() => setCurrentView(AppView.SALES_RETURN)}
              />
            );
            case AppView.PURCHASE_HISTORY: return <PurchaseHistoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.PURCHASE_RETURN_HISTORY: return <PurchaseReturnHistoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.PROFESSIONAL_INVOICE: return <ProfessionalInvoiceView onBack={() => setCurrentView(AppView.DASHBOARD)} settings={settings} />;
            case AppView.INVENTORY: return <InventoryView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CASH_JOURNAL: return <CashJournalView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CUSTOMER_BALANCES: return <CustomerBalancesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CASH_FILE: return <DailyBalancesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.REPORTS: return <ProfitLossReportView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.STOCK_ENTRIES: return <StockEntriesView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.DETAILED_ITEM_MOVEMENT: return <DetailedItemMovementView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.CUSTOMER_INVOICE_COSTS: return <CustomerInvoiceCostsView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
            case AppView.SALES_RETURN: return <SalesReturnView onBack={() => setCurrentView(AppView.DASHBOARD)} />;
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
            default: return <Dashboard setView={setCurrentView} />;
          }
        })()}
      </main>

      <footer className="no-print mt-auto py-6 px-8 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
            <span>© 2025</span>
            <span className="text-primary">{settings.companyName}</span>
            <span>جميع الحقوق محفوظة</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-200/50 dark:bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Developer</span>
            <div className="w-px h-3 bg-zinc-400/30 mx-1"></div>
            <span className="text-xs font-black text-zinc-600 dark:text-zinc-300">BY: MOHANNAD AHMAD - SYRIA</span>
            <Heart className="w-3 h-3 text-primary fill-primary animate-pulse" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
