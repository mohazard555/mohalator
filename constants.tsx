
import React from 'react';
import { ShoppingCart, Warehouse, Wallet, Settings, TrendingUp } from 'lucide-react';
import { AppView } from './types';

export const MENU_GROUPS = [
  {
    title: 'الصندوق والمالية',
    icon: <Wallet className="w-5 h-5" />,
    items: [
      { label: 'ملف الصندوق اليومي', view: AppView.CASH_FILE },
      { label: 'إدارة البنود والأقسام', view: AppView.ACCOUNTING_CATEGORIES },
      { label: 'سندات القبض', view: AppView.RECEIPT_VOUCHER },
      { label: 'سندات الدفع', view: AppView.PAYMENT_VOUCHER },
      { label: 'دفتر اليومية الشامل', view: AppView.CASH_JOURNAL },
      { label: 'ميزان المراجعة والأرباح', view: AppView.REPORTS },
    ]
  },
  {
    title: 'المبيعات والعملاء',
    icon: <ShoppingCart className="w-5 h-5" />,
    items: [
      { label: 'فاتورة مبيعات ذكية', view: AppView.SALES_INVOICE },
      { label: 'سجل المبيعات العام', view: AppView.SALES_HISTORY },
      { label: 'سجل مرتجع مبيعات', view: AppView.SALES_RETURN_HISTORY },
      { label: 'مرتجع مبيعات (جديد)', view: AppView.SALES_RETURN },
      { label: 'تصدير فاتورة احترافي', view: AppView.PROFESSIONAL_INVOICE },
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
      { label: 'سجل مرتجع مشتريات', view: AppView.PURCHASE_RETURN_HISTORY },
      { label: 'حركة مادة مفصلة', view: AppView.DETAILED_ITEM_MOVEMENT },
      { label: 'تكاليف فاتورة محددة', view: AppView.CUSTOMER_INVOICE_COSTS },
      { label: 'قائمة المواد والجرد', view: AppView.INVENTORY },
      { label: 'إدارة ملف المستودعات', view: AppView.WAREHOUSE_MANAGEMENT },
      { label: 'إدخالات وصرف المواد', view: AppView.STOCK_ENTRIES },
      { label: 'إدارة الحسابات (جهات)', view: AppView.PARTY_MANAGEMENT },
    ]
  },
  {
    title: 'التقارير المتقدمة',
    icon: <TrendingUp className="w-5 h-5" />,
    items: [
      { label: 'تقارير استثمارية وشاملة', view: AppView.INVESTMENT_REPORTS },
      { label: 'تحليلات المستودع', view: AppView.WAREHOUSE_ANALYTICS },
      { label: 'الأرشفة والتدوير', view: AppView.ARCHIVES },
      { label: 'إعدادات النظام', view: AppView.SETTINGS },
    ]
  }
];
