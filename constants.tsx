
import React from 'react';
import { ShoppingCart, Warehouse, Wallet, Settings, Truck, RotateCcw, FileText, ClipboardList, Users } from 'lucide-react';
import { AppView } from './types';

export const MENU_GROUPS = [
  {
    title: 'الصندوق والمالية',
    icon: <Wallet className="w-5 h-5" />,
    items: [
      { label: 'ملف الصندوق اليومي', view: AppView.CASH_FILE },
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
      { label: 'مرتجع مبيعات', view: AppView.SALES_RETURN },
      { label: 'تصدير فاتورة احترافي', view: AppView.PROFESSIONAL_INVOICE },
      { label: 'كشف حساب زبون', view: AppView.DETAILED_SALES_REPORT },
      { label: 'الدفعات المستحقة', view: AppView.CUSTOMER_BALANCES },
      { label: 'إدارة العملاء', view: AppView.PARTY_MANAGEMENT },
    ]
  },
  {
    title: 'المشتريات والموردين',
    icon: <Truck className="w-5 h-5" />,
    items: [
      { label: 'فاتورة مشتريات', view: AppView.PURCHASE_INVOICE },
      { label: 'مرتجع مشتريات', view: AppView.PURCHASE_RETURN },
      { label: 'إدارة الموردين', view: AppView.PARTY_MANAGEMENT },
    ]
  },
  {
    title: 'المستودعات والمواد',
    icon: <Warehouse className="w-5 h-5" />,
    items: [
      { label: 'قائمة المواد', view: AppView.INVENTORY },
      { label: 'إدخالات وصرف المواد', view: AppView.STOCK_ENTRIES },
      { label: 'حركة مادة مفصلة', view: AppView.DETAILED_ITEM_MOVEMENT },
      { label: 'تحليلات المستودع', view: AppView.WAREHOUSE_ANALYTICS },
    ]
  },
  {
    title: 'أدوات النظام',
    icon: <Settings className="w-5 h-5" />,
    items: [
      { label: 'الأرشفة والتدوير', view: AppView.ARCHIVES },
      { label: 'إعدادات النظام', view: AppView.SETTINGS },
    ]
  }
];
