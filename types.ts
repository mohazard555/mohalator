
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
  DETAILED_SUPPLIER_REPORT = 'DETAILED_SUPPLIER_REPORT',
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
  ACCOUNTING_CATEGORIES = 'ACCOUNTING_CATEGORIES',
  ACCOUNTING_CENTER = 'ACCOUNTING_CENTER',
  GENERAL_LEDGER = 'GENERAL_LEDGER',
  CHART_OF_ACCOUNTS = 'CHART_OF_ACCOUNTS',
  BALANCE_SHEET = 'BALANCE_SHEET',
  TRADING_ACCOUNT = 'TRADING_ACCOUNT',
  INCOME_STATEMENT = 'INCOME_STATEMENT',
  OPENING_ENTRIES = 'OPENING_ENTRIES',
  PERIODIC_INVENTORY = 'PERIODIC_INVENTORY',
  DOLLAR_BALANCES = 'DOLLAR_BALANCES',
  INVOICE_GALLERY = 'INVOICE_GALLERY',
  JOURNAL_ENTRY = 'JOURNAL_ENTRY',
  RECONCILIATION = 'RECONCILIATION',
  COMPANY_MANAGEMENT = 'COMPANY_MANAGEMENT'
}

export interface Company {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  fiscalYear: string;
  currency: string;
  currencySymbol: string;
  adminUsername: string;
  adminPassword?: string;
  createdAt: string;
}

export interface ReconciliationEntry {
  id: string;
  partyName: string;
  partyType: 'زبون' | 'مورد' | 'كلاهما';
  periodStart: string;
  periodEnd: string;
  balanceAtReconciliation: number;
  reconciliationDate: string;
  user: string;
  notes: string;
}

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  type: 'FOLDER' | 'ACCOUNT';
  reportType: 'الميزانية' | 'المتاجرة' | 'الأرباح والخسائر';
}

export enum PartyType {
  CUSTOMER = 'عميل',
  SUPPLIER = 'مورد',
  BOTH = 'عميل ومورد'
}

export interface OpeningEntry {
  id: string;
  accountName: string;
  accountType: 'أصول' | 'خصوم' | 'حقوق ملكية';
  debit: number;
  credit: number;
  date: string;
  notes: string;
}

export interface PeriodicInventory {
  id: string;
  date: string;
  type: 'OPENING' | 'CLOSING';
  items: {
    itemCode: string;
    itemName: string;
    quantity: number;
    price: number;
    total: number;
    unit: string;
  }[];
  totalValue: number;
  notes: string;
}

export interface AccountingCategory {
  id: string;
  name: string;
  accountCode?: string;
  type: 'مصروفات' | 'إيرادات';
  notes?: string;
  linkedAccountId?: string;
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
  discountAmount?: number;
  paymentType: 'نقداً' | 'آجل';
  cashAccount?: 'الصندوق' | 'المصرف';
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
  transportExpenses: number;
  discountAmount: number;
  notes: string;
  currencySymbol?: string;
  paymentType: 'نقداً' | 'آجل';
  cashAccount?: 'الصندوق' | 'المصرف';
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
  type?: 'قبض' | 'دفع' | 'بيع' | 'شراء' | 'مرتجع' | 'افتتاحي' | 'حسم' | 'قيد';
  voucherNumber?: string;
  partyName?: string;
  amount?: number;
  amountLiteral?: string;
  categoryId?: string; 
  cashAccount?: 'الصندوق' | 'المصرف';
}

export interface WarehouseEntity {
  id: string;
  name: string;
  location: string;
  isMain: boolean;
}

export interface ArchiveEntry {
  id: string;
  archiveDate: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  data: string;
}
