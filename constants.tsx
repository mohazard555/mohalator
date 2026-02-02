
import React from 'react';
import { 
  ShoppingCart, Warehouse, Wallet, Settings, TrendingUp, 
  Landmark, BookOpen, Scale, Box, PieChart, Activity, 
  BarChart3, ListTree, History, FileOutput, Users, 
  ClipboardList, Receipt, Layers, Coins, ImageIcon
} from 'lucide-react';
import { AppView } from './types';

export const MENU_GROUPS = [
  {
    title: 'المركز المحاسبي والختامي',
    icon: <Landmark className="w-5 h-5" />,
    items: [
      { label: 'دليل الحسابات الشجري', view: AppView.CHART_OF_ACCOUNTS },
      { label: 'الميزانية العمومية (Assets)', view: AppView.BALANCE_SHEET },
      { label: 'حساب المتاجرة (Trading)', view: AppView.TRADING_ACCOUNT },
      { label: 'قائمة الأرباح والخسائر', view: AppView.INCOME_STATEMENT },
      { label: 'القيد الافتتاحي العام', view: AppView.OPENING_ENTRIES },
      { label: 'إدارة جرد أول/آخر المدة', view: AppView.PERIODIC_INVENTORY },
    ]
  },
  {
    title: 'الصندوق والمالية',
    icon: <Wallet className="w-5 h-5" />,
    items: [
      { label: 'دفتر الأستاذ العام', view: AppView.GENERAL_LEDGER },
      { label: 'أرصدة وحركات الدولار', view: AppView.DOLLAR_BALANCES },
      { label: 'ملف الصندوق اليومي', view: AppView.CASH_FILE },
      { label: 'دفتر اليومية الشامل', view: AppView.CASH_JOURNAL },
      { label: 'سندات القبض والدفع', view: AppView.RECEIPT_VOUCHER },
      { label: 'إدارة البنود والأقسام', view: AppView.ACCOUNTING_CATEGORIES },
    ]
  },
  {
    title: 'المبيعات والعملاء',
    icon: <ShoppingCart className="w-5 h-5" />,
    items: [
      { label: 'فاتورة مبيعات ذكية', view: AppView.SALES_INVOICE },
      { label: 'سجل المبيعات العام', view: AppView.SALES_HISTORY },
      { label: 'مرتجع مبيعات', view: AppView.SALES_RETURN },
      { label: 'سجل مرتجع المبيعات', view: AppView.SALES_RETURN_HISTORY },
      { label: 'كشف حساب زبون مفصل', view: AppView.DETAILED_SALES_REPORT },
      { label: 'أرصدة العملاء والموردين', view: AppView.CUSTOMER_BALANCES },
    ]
  },
  {
    title: 'المشتريات والمستودعات',
    icon: <Warehouse className="w-5 h-5" />,
    items: [
      { label: 'فاتورة مشتريات', view: AppView.PURCHASE_INVOICE },
      { label: 'سجل المشتريات', view: AppView.PURCHASE_HISTORY },
      { label: 'سجل مرتجع المشتريات', view: AppView.PURCHASE_RETURN_HISTORY },
      { label: 'قائمة المواد والجرد', view: AppView.INVENTORY },
      { label: 'إدارة حسابات (جهات)', view: AppView.PARTY_MANAGEMENT },
      { label: 'إدارة ملف المستودعات', view: AppView.WAREHOUSE_MANAGEMENT },
      { label: 'إدخالات وصرف المواد', view: AppView.STOCK_ENTRIES },
    ]
  },
  {
    title: 'التقارير المتقدمة',
    icon: <TrendingUp className="w-5 h-5" />,
    items: [
      { label: 'صور وبطاقات الفواتير', view: AppView.INVOICE_GALLERY },
      { label: 'حركة مادة مفصلة', view: AppView.DETAILED_ITEM_MOVEMENT },
      { label: 'تكاليف فاتورة محددة', view: AppView.CUSTOMER_INVOICE_COSTS },
      { label: 'تصدير فاتورة احترافي', view: AppView.PROFESSIONAL_INVOICE },
      { label: 'تقارير استثمارية وشاملة', view: AppView.INVESTMENT_REPORTS },
      { label: 'تحليلات المستودع', view: AppView.WAREHOUSE_ANALYTICS },
      { label: 'إعدادات النظام', view: AppView.SETTINGS },
    ]
  }
];
