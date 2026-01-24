
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SALES_INVOICE = 'SALES_INVOICE',
  SALES_HISTORY = 'SALES_HISTORY',
  PURCHASE_HISTORY = 'PURCHASE_HISTORY',
  SALES_RETURN_HISTORY = 'SALES_RETURN_HISTORY',
  PURCHASE_RETURN_HISTORY = 'PURCHASE_RETURN_HISTORY',
  PROFESSIONAL_INVOICE = 'PROFESSIONAL_INVOICE',
  INVENTORY = 'INVENTORY',
  CASH_JOURNAL = 'CASH_JOURNAL',
  CUSTOMER_BALANCES = 'CUSTOMER_BALANCES',
  REPORTS = 'REPORTS',
  DAILY_BALANCES = 'DAILY_BALANCES',
  STOCK_ENTRIES = 'STOCK_ENTRIES',
  ITEM_MOVEMENT = 'ITEM_MOVEMENT',
  CUSTOMER_INVOICE_COSTS = 'CUSTOMER_INVOICE_COSTS',
  DETAILED_ITEM_MOVEMENT = 'DETAILED_ITEM_MOVEMENT',
  SALES_RETURN = 'SALES_RETURN',
  PURCHASE_RETURN = 'PURCHASE_RETURN',
  DETAILED_SALES_REPORT = 'DETAILED_SALES_REPORT',
  RECEIPT_VOUCHER = 'RECEIPT_VOUCHER',
  PAYMENT_VOUCHER = 'PAYMENT_VOUCHER',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  PARTY_MANAGEMENT = 'PARTY_MANAGEMENT',
  SETTINGS = 'SETTINGS',
  WAREHOUSE_ANALYTICS = 'WAREHOUSE_ANALYTICS',
  WAREHOUSE_MANAGEMENT = 'WAREHOUSE_MANAGEMENT',
  ARCHIVES = 'ARCHIVES',
  CASH_FILE = 'CASH_FILE',
  INVESTMENT_REPORTS = 'INVESTMENT_REPORTS',
  ACCOUNTING_CATEGORIES = 'ACCOUNTING_CATEGORIES'
}

export enum PartyType {
  CUSTOMER = 'عميل',
  SUPPLIER = 'مورد',
  BOTH = 'عميل ومورد'
}

export interface AccountingCategory {
  id: string;
  name: string;
  type: 'مصروفات' | 'إيرادات';
  notes?: string;
}

export interface AppSettings {
  companyName: string;
  companyType: string;
  website: string;
  managerName: string;
  accountantName: string;
  logoUrl?: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  language: 'ar' | 'en';
  currency: string;
  currencySymbol: string;
  secondaryCurrency: string;
  secondaryCurrencySymbol: string;
  isLoginEnabled: boolean;
  username: string;
  password?: string;
  passwordHint: string;
}

export interface InvoiceItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  notes: string;
  image?: string;
  serialNumber?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number;
  totalAmountLiteral: string;
  notes: string;
  usedMaterials?: any[];
  paidAmount?: number;
  paymentType: 'نقداً' | 'آجل';
  currencySymbol?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  supplierName: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  notes: string;
}

export interface StockEntry {
  id: string;
  date: string;
  day: string;
  department: string;
  itemCode: string;
  itemName: string;
  unit: string;
  price: number;
  warehouse: string;
  warehouseType?: string;
  movementType: 'إدخال' | 'صرف' | 'مرتجع';
  quantity: number;
  invoiceNumber: string;
  partyName?: string;
  statement: string;
  notes?: string;
  movementCode?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  openingStock: number;
  currentBalance: number;
  added: number;
  issued: number;
  returned: number;
  warehouse?: string;
}

export interface Party {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  type: PartyType;
  openingBalance: number;
}

export interface CashEntry {
  id: string;
  date: string;
  time?: string;
  statement: string;
  receivedSYP: number;
  paidSYP: number;
  receivedUSD: number;
  paidUSD: number;
  notes: string;
  type?: 'قبض' | 'دفع' | 'بيع' | 'شراء' | 'مرتجع';
  voucherNumber?: string;
  partyName?: string;
  amount?: number;
  amountLiteral?: string;
  categoryId?: string; // ربط القيد بالقسم
}

export interface ArchiveEntry {
  id: string;
  archiveDate: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  data: string;
}

export interface WarehouseEntity {
  id: string;
  name: string;
  location: string;
  isMain: boolean;
}
