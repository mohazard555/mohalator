
import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, ChevronRight, ChevronDown, 
  Search, Plus, Trash2, Edit2, X, Landmark, 
  ArrowLeftRight, Calculator, ImageIcon, FileSpreadsheet, Printer, Save, History, ArrowRight, Info, ArrowUpRight, ArrowDownLeft, FileStack, UserCircle, FileText
} from 'lucide-react';
import { AccountNode, CashEntry, OpeningEntry, AppSettings, SalesInvoice, PurchaseInvoice, AccountingCategory, Party, PartyType, InventoryItem, StockEntry, PeriodicInventory } from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import { exportToCSV } from '../utils/export';

interface ChartOfAccountsViewProps {
  onBack?: () => void;
}

const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({ onBack }) => {
  const movementsRef = useRef<HTMLDivElement>(null);
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '11', '12', '2', '21', '22', '3', '4', '5', '6', '7']));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  
  // States for Popups
  const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false);
  const [detailAccount, setDetailAccount] = useState<AccountNode | null>(null);
  const [isMoveDetailOpen, setIsMoveDetailOpen] = useState(false);
  const [selectedMove, setSelectedMove] = useState<any | null>(null);

  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [formData, setFormData] = useState<Partial<AccountNode>>({
    name: '', code: '', type: 'ACCOUNT', reportType: 'الميزانية', parentId: null
  });

  const getPrefix = () => {
    const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
    return activeId === 'default' ? 'sheno' : `sheno_${activeId}`;
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const prefix = getPrefix();
    const savedAccountsRaw = localStorage.getItem(`${prefix}_chart_accounts`);
    const sJou = localStorage.getItem(`${prefix}_cash_journal`);
    const sOp = localStorage.getItem(`${prefix}_opening_entries`);
    const sSal = localStorage.getItem(`${prefix}_sales_invoices`);
    const sSalRet = localStorage.getItem(`${prefix}_sales_returns`);
    const sPur = localStorage.getItem(`${prefix}_purchases`);
    const sPurRet = localStorage.getItem(`${prefix}_purchase_returns`);
    const sCat = localStorage.getItem(`${prefix}_accounting_categories`);
    const sPar = localStorage.getItem(`${prefix}_parties`);
    const sInv = localStorage.getItem(`${prefix}_inventory_list`);
    const sSto = localStorage.getItem(`${prefix}_stock_entries`);
    const sSett = localStorage.getItem(`${prefix}_settings`);

    const defaultRoots: AccountNode[] = [
      { id: '1', code: '1', name: 'الموجودات', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
      { id: '11', code: '11', name: 'الموجودات الثابتة', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '111', code: '111', name: 'آلات ومعدات', parentId: '11', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '112', code: '112', name: 'سيارات ووسائط نقل', parentId: '11', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '113', code: '113', name: 'أثاث ومفروشات مكتبية', parentId: '11', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '12', code: '12', name: 'الموجودات المتداولة', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '121', code: '121', name: 'الزبائن المدينون', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '124', code: '124', name: 'المخزون السلعي', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '1241', code: '1241', name: 'بضاعة آخر المدة (مخزن)', parentId: '124', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '13', code: '13', name: 'الأموال الجاهزة ونقدية', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '131', code: '131', name: 'الصندوق الرئيسي', parentId: '13', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '132', code: '132', name: 'حساب المصرف البنكي', parentId: '13', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '2', code: '2', name: 'المطاليب والخصوم', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
      { id: '21', code: '21', name: 'حقوق الملكية والمطاليب الثابتة', parentId: '2', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '211', code: '211', name: 'رأس المال', parentId: '21', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '212', code: '212', name: 'قروض طويلة الأجل', parentId: '21', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '213', code: '213', name: 'التزامات تمويلية', parentId: '21', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '22', code: '22', name: 'المطاليب المتداولة', parentId: '2', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '221', code: '221', name: 'الموردون والدائنون', parentId: '22', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '3', code: '3', name: 'صافي المشتريات', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
      { id: '31', code: '31', name: 'إجمالي المشتريات', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '32', code: '32', name: 'مرتجع المشتريات', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '33', code: '33', name: 'مصاريف نقل المشتريات', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '34', code: '34', name: 'الحسم المكتسب', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '4', code: '4', name: 'صافي المبيعات', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
      { id: '41', code: '41', name: 'إجمالي المبيعات', parentId: '4', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '42', code: '42', name: 'مرتجع المبيعات', parentId: '4', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '43', code: '43', name: 'الحسم الممنوح', parentId: '4', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '5', code: '5', name: 'المصاريف التشغيلية والعمومية', parentId: null, type: 'FOLDER', reportType: 'الأرباح والخسائر' },
      { id: '501', code: '501', name: 'مصاريف رواتب وأجور', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '502', code: '502', name: 'مصاريف إيجار', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '503', code: '503', name: 'مصاريف كهرباء ومياه', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '504', code: '504', name: 'مصاريف صيانة وعمرة', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '6', code: '6', name: 'الايرادات الأخرى والتحويلات', parentId: null, type: 'FOLDER', reportType: 'الأرباح والخسائر' },
      { id: '7', code: '7', name: 'بضاعة المتاجرة السنوية', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
      { id: '71', code: '71', name: 'بضاعة اول المدة', parentId: '7', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '72', code: '72', name: 'بضاعة أخر المدة', parentId: '7', type: 'ACCOUNT', reportType: 'المتاجرة' }
    ];

    let currentAccounts: AccountNode[] = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : defaultRoots;
    setAccounts(currentAccounts);
    
    let currentJournal: CashEntry[] = sJou ? JSON.parse(sJou) : [];
    const currentSales: SalesInvoice[] = sSal ? JSON.parse(sSal) : [];
    const currentSalesReturns: any[] = sSalRet ? JSON.parse(sSalRet) : [];
    const currentPurchases: PurchaseInvoice[] = sPur ? JSON.parse(sPur) : [];
    const currentPurchaseReturns: any[] = sPurRet ? JSON.parse(sPurRet) : [];
    const currentStock: StockEntry[] = sSto ? JSON.parse(sSto) : [];
    const currentInventory: InventoryItem[] = sInv ? JSON.parse(sInv) : [];
    const currentCategories: AccountingCategory[] = sCat ? JSON.parse(sCat) : [];
    
    let changed = false;
    
    // تم إزالة منطق المزامنة التلقائية للمبيعات من هنا لمنع التكرار.

    // تم إزالة منطق المزامنة التلقائية للمرتجعات من هنا لمنع التكرار.

    // تم إزالة منطق المزامنة التلقائية للمشتريات من هنا لمنع التكرار.

    // تم إزالة منطق المزامنة التلقائية لمرتجع المشتريات من هنا لمنع التكرار.

    // تم إزالة منطق المزامنة التلقائية لبضاعة أول المدة من هنا.

    // تم إزالة منطق المزامنة التلقائية للمخازن من هنا.


    setJournal(currentJournal);
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sSal) setSales(JSON.parse(sSal));
    if (sSalRet) setSalesReturns(JSON.parse(sSalRet));
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sPurRet) setPurchaseReturns(JSON.parse(sPurRet));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sPar) setParties(JSON.parse(sPar));
    if (sInv) setInventory(JSON.parse(sInv));
    if (sSto) setStockEntries(JSON.parse(sSto));
    if (sSett) setSettings(JSON.parse(sSett));
  };

  const calculateBalance = (account: AccountNode): number => {
    if (account.type === 'FOLDER') {
      const children = accounts.filter(a => a.parentId === account.id);
      
      // معادلة صافي المشتريات (CODE 3): إجمالي المشتريات + مصاريف نقل - مرتجع المشتريات - الحسم المكتسب
      if (account.code === '3') {
         const b31 = calculateBalance(children.find(c => c.code === '31') || { id: '31', code: '31', type: 'ACCOUNT' } as any);
         const b32 = calculateBalance(children.find(c => c.code === '32') || { id: '32', code: '32', type: 'ACCOUNT' } as any);
         const b33 = calculateBalance(children.find(c => c.code === '33') || { id: '33', code: '33', type: 'ACCOUNT' } as any);
         const b34 = calculateBalance(children.find(c => c.code === '34') || { id: '34', code: '34', type: 'ACCOUNT' } as any);
         return (Math.abs(b31) + Math.abs(b33)) - (Math.abs(b32) + Math.abs(b34));
      }
      
      // معادلة صافي المبيعات (CODE 4): إجمالي المبيعات - مرتجع المبيعات - الحسم الممنوح
      if (account.code === '4') {
         const b41 = calculateBalance(children.find(c => c.code === '41') || { id: '41', code: '41', type: 'ACCOUNT' } as any);
         const b42 = calculateBalance(children.find(c => c.code === '42') || { id: '42', code: '42', type: 'ACCOUNT' } as any);
         const b43 = calculateBalance(children.find(c => c.code === '43') || { id: '43', code: '43', type: 'ACCOUNT' } as any);
         return Math.abs(b41) - (Math.abs(b42) + Math.abs(b43));
      }

      return children.reduce((s, c) => s + Math.abs(calculateBalance(c)), 0);
    }
    
    const code = String(account.code || '').trim();
    const name = account.name;

    // حساب بضاعة آخر المدة ديناميكياً (72 / 1241)
    if (code === '72' || code === '1241') {
       return inventory.reduce((sum, item) => {
          const mvs = stockEntries.filter(e => e.itemCode === item.code);
          const bal = (item.openingStock || 0) + mvs.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0) - mvs.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0) + mvs.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
          return sum + (bal * item.price);
       }, 0);
    }

    let debitTotal = 0;
    let creditTotal = 0;

    // 2. حركات اليومية
    const linkedCatIds = new Set(categories.filter(c => c.linkedAccountId === account.id).map(c => c.id));
    const isBox = code === '131' || code === '132';

    journal.forEach(j => {
       let match = false;
       const jCode = String(j.linkedAccountCode || '').trim();
       const jId = String(j.linkedAccountId || '').trim();
       const aId = String(account.id || '').trim();

       if (jCode === code || jId === aId) {
          match = true;
       } else if (j.categoryId && linkedCatIds.has(j.categoryId)) {
          match = true;
       } else if (j.partyName === name) {
          if (!j.linkedAccountCode && !j.linkedAccountId) {
             match = true;
          }
       }
       else if (isBox) {
          if (j.type !== 'قيد' && j.type !== 'افتتاحي') {
             if (code === '131' && (j.cashAccount === 'الصندوق' || (!j.cashAccount && !j.statement.includes('المصرف')))) match = true;
             if (code === '132' && (j.cashAccount === 'المصرف' || (!j.cashAccount && j.statement.includes('المصرف')))) match = true;
          }
       }

       if (match) {
          if (isBox) {
             debitTotal += (Number(j.receivedSYP || 0) + Number(j.receivedUSD || 0));
             creditTotal += (Number(j.paidSYP || 0) + Number(j.paidUSD || 0));
          } else {
             debitTotal += (Number(j.paidSYP || 0) + Number(j.paidUSD || 0));
             creditTotal += (Number(j.receivedSYP || 0) + Number(j.receivedUSD || 0));
          }
       }
    });

    // رصيد أول المدة للزبائن والموردين (تم إيقافه لأنه مدمج في اليومية الآن لمنع التكرار)
    /*
    const party = parties.find(p => p.name === name);
    if (party) {
       if (party.type === 'عميل' || account.parentId === '121') debitTotal += (party.openingBalance || 0);
       else if (party.type === 'مورد' || account.parentId === '221') creditTotal += (party.openingBalance || 0);
    }
    */

    // تحديد طبيعة الحساب (مدين أو دائن)
    const isDebitNature = 
      code.startsWith('1') || // الموجودات
      code.startsWith('5') || // المصاريف
      code === '3' || code === '31' || code === '33' || // المشتريات ومصاريف النقل
      code === '42' || code === '43' || // مرتجع المبيعات والحسم الممنوح
      code === '71'; // بضاعة أول المدة
      
    const balance = isDebitNature ? (debitTotal - creditTotal) : (creditTotal - debitTotal);
    return balance;
  };

  const getAccountMovements = (account: AccountNode): any[] => {
    if (account.type === 'FOLDER') {
      const children = accounts.filter(a => a.parentId === account.id);
      let allMoves: any[] = [];
      children.forEach(child => {
        allMoves = [...allMoves, ...getAccountMovements(child)];
      });
      return allMoves.sort((a, b) => a.date.localeCompare(b.date));
    }

    const moves: any[] = [];
    const name = account.name;
    const code = account.code;

    // حركات بضاعة آخر المدة الافتراضية (72 / 1241)
    if (code === '72' || code === '1241') {
       inventory.forEach(item => {
          const mvs = stockEntries.filter(e => e.itemCode === item.code);
          const bal = (item.openingStock || 0) + mvs.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0) - mvs.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0) + mvs.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
          if (bal !== 0) {
             moves.push({
                date: new Date().toISOString().split('T')[0],
                number: 'INV',
                statement: `رصيد جرد حالي: ${item.name} (${bal} ${item.unit})`,
                debit: code === '1241' ? (bal * item.price) : 0,
                credit: code === '72' ? (bal * item.price) : 0,
                source: 'جرد مستمر',
                counterAccount: code === '1241' ? 'المتاجرة' : 'المخزون السلعي',
                user: 'النظام',
                accountName: name
             });
          }
       });
    }

    // 2. حركات اليومية
    const linkedCatIds = new Set(categories.filter(c => c.linkedAccountId === account.id).map(c => c.id));
    const isBox = code === '131' || code === '132';

    journal.forEach(j => {
       let match = false;
       if (j.linkedAccountCode === code || j.linkedAccountId === account.id) {
          match = true;
       } else if (j.categoryId && linkedCatIds.has(j.categoryId)) {
          match = true;
       } else if (j.partyName === name) {
          if (!j.linkedAccountCode && !j.linkedAccountId) {
             match = true;
          }
       }
       else if (isBox) {
          if (j.type !== 'قيد' && j.type !== 'افتتاحي') {
             if (code === '131' && (j.cashAccount === 'الصندوق' || (!j.cashAccount && !j.statement.includes('المصرف')))) match = true;
             if (code === '132' && (j.cashAccount === 'المصرف' || (!j.cashAccount && j.statement.includes('المصرف')))) match = true;
          }
       }

       if (match) {
          moves.push({ 
             date: j.date, 
             number: j.voucherNumber || 'VOU', 
             statement: j.statement, 
             debit: isBox ? (Number(j.receivedSYP || 0) + Number(j.receivedUSD || 0)) : (Number(j.paidSYP || 0) + Number(j.paidUSD || 0)), 
             credit: isBox ? (Number(j.paidSYP || 0) + Number(j.paidUSD || 0)) : (Number(j.receivedSYP || 0) + Number(j.receivedUSD || 0)), 
             source: j.type === 'قبض' ? 'سند قبض' : j.type === 'دفع' ? 'سند دفع' : (j.type || 'سند يومية'), 
             counterAccount: (j.type === 'افتتاحي' || j.type === 'قيد') ? (j.partyName || 'مذكورين') : (isBox ? (j.partyName || 'حساب متنوع') : (j.linkedAccountCode === '42' || j.linkedAccountCode === '43' || j.linkedAccountCode === '32' || j.linkedAccountCode === '34' ? (j.partyName || 'حساب العميل/المورد') : 'الصندوق / المصرف')),
             user: settings?.managerName || 'النظام',
             accountName: name
          });
       }
    });

    return moves.sort((a, b) => a.date.localeCompare(b.date));
  };

  const handleSaveNode = () => {
    if (!formData.name || !formData.code) return;
    const prefix = getPrefix();
    const newNode = { ...formData, id: modalMode === 'EDIT' ? selectedAccount!.id : crypto.randomUUID() } as AccountNode;
    
    // مزامنة العملاء والموردين عند الإضافة الجديدة
    if (modalMode === 'ADD') {
      const isCustomer = newNode.parentId === '121';
      const isSupplier = newNode.parentId === '221';
      
      if (isCustomer || isSupplier) {
        const savedParties = localStorage.getItem(`${prefix}_parties`);
        let currentParties: Party[] = savedParties ? JSON.parse(savedParties) : [];
        if (!currentParties.some(p => p.name === newNode.name)) {
          const newParty: Party = {
            id: crypto.randomUUID(),
            code: newNode.code,
            name: newNode.name,
            type: isCustomer ? PartyType.CUSTOMER : PartyType.SUPPLIER,
            openingBalance: 0,
            phone: '',
            address: ''
          };
          localStorage.setItem(`${prefix}_parties`, JSON.stringify([...currentParties, newParty]));
        }
      }
    }

    const updated = modalMode === 'EDIT' ? accounts.map(a => a.id === selectedAccount!.id ? newNode : a) : [...accounts, newNode];
    setAccounts(updated);
    localStorage.setItem(`${prefix}_chart_accounts`, JSON.stringify(updated));
    setIsModalOpen(false);
    setSelectedAccount(null);
    loadAllData();
  };

  const handleDeleteNode = (node: AccountNode, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. فحص وجود حسابات تابعة (للمجلدات)
    const children = accounts.filter(a => a.parentId === node.id);
    if (children.length > 0) {
      alert('لا يمكن حذف مجموعة تحتوي على حسابات فرعية. يرجى حذف الحسابات التابعة أولاً.');
      return;
    }

    // 2. فحص وجود حركات مالية
    const movements = getAccountMovements(node);
    if (movements.length > 0) {
      alert(`لا يمكن حذف الحساب "${node.name}" لأنه يحتوي على حركات مالية مسجلة. يجب تصفية الحركات أو حذفها أولاً.`);
      return;
    }

    // 3. تأكيد الحذف
    if (window.confirm(`هل أنت متأكد من حذف الحساب "${node.name}" نهائياً؟`)) {
      const prefix = getPrefix();
      const updated = accounts.filter(a => a.id !== node.id);
      setAccounts(updated);
      localStorage.setItem(`${prefix}_chart_accounts`, JSON.stringify(updated));
      if (selectedAccount?.id === node.id) setSelectedAccount(null);
    }
  };

  const handleAccountIconClick = (node: AccountNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailAccount(node);
    setIsDetailPopupOpen(true);
  };

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    const nodes = accounts.filter(a => a.parentId === parentId).sort((a, b) => a.code.localeCompare(b.code));
    return nodes.map(node => {
        const isExpanded = expandedNodes.has(node.id);
        const bal = calculateBalance(node);
        const children = accounts.filter(a => a.parentId === node.id);
        if (searchTerm && !node.name.includes(searchTerm) && !node.code.includes(searchTerm)) return null;
        
        const isFolder = node.type === 'FOLDER';

        return (
          <div key={node.id} className="select-none">
            <div 
               className={`flex items-center py-3 px-4 rounded-2xl transition-all cursor-pointer group mb-1.5 ${selectedAccount?.id === node.id ? 'bg-primary/10 ring-2 ring-primary/20 shadow-md' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`} 
               onClick={() => {
                  if (!isFolder) {
                    setSelectedAccount(node);
                  } else {
                     const n = new Set(expandedNodes); if(n.has(node.id)) n.delete(node.id); else n.add(node.id); setExpandedNodes(n);
                  }
               }}
            >
              <div style={{ width: `${level * 28}px` }}></div>
              <button onClick={(e) => { e.stopPropagation(); const n = new Set(expandedNodes); if(n.has(node.id)) n.delete(node.id); else n.add(node.id); setExpandedNodes(n); }} className="p-1 text-zinc-400">
                {children.length > 0 ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4" />}
              </button>
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                {node.type === 'FOLDER' ? <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" /> : <Calculator className="w-4 h-4 text-primary opacity-40" />}
                <div className="flex items-center gap-2 truncate">
                   <span className="font-black text-readable text-sm leading-tight">{node.name}</span>
                   {/* Info Icon for Account Card */}
                   <button onClick={(e) => handleAccountIconClick(node, e)} className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-all">
                      <Info className="w-3.5 h-3.5" />
                   </button>
                   <span className="font-mono text-zinc-400 text-[9px] uppercase tracking-tighter">ID: {node.code}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <span className={`font-mono text-sm font-black min-w-[100px] text-left ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>{bal !== 0 ? Math.abs(bal).toLocaleString() : '-'}</span>
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 no-print transition-all">
                    <button onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, parentId: node.id, type: 'ACCOUNT' }); setModalMode('ADD'); setIsModalOpen(true); }} className="p-1.5 bg-white dark:bg-zinc-700 rounded-lg text-zinc-400 hover:text-primary shadow-sm"><Plus className="w-4 h-4"/></button>
                    <button onClick={(e) => { e.stopPropagation(); setFormData(node); setModalMode('EDIT'); setIsModalOpen(true); }} className="p-1.5 bg-white dark:bg-zinc-700 rounded-lg text-zinc-400 hover:text-amber-500 shadow-sm"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={(e) => handleDeleteNode(node, e)} className="p-1.5 bg-white dark:bg-zinc-700 rounded-lg text-zinc-400 hover:text-rose-500 shadow-sm"><Trash2 className="w-4 h-4"/></button>
                 </div>
              </div>
            </div>
            {isExpanded && <div className="mr-5 border-r-2 border-zinc-100 dark:border-zinc-800/50">{renderTree(node.id, level + 1)}</div>}
          </div>
        );
      });
  };

  const accountMoves = selectedAccount ? getAccountMovements(selectedAccount) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className={`lg:col-span-5 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[calc(100vh-180px)] no-print overflow-hidden`}>
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
              {onBack && <button onClick={onBack} className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-all shadow-sm"><ArrowRight className="w-6 h-6" /></button>}
              <Landmark className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-black text-readable tracking-tight">دليل الحسابات الشجري</h3>
           </div>
           <button onClick={() => { setModalMode('ADD'); setFormData({ name: '', code: '', type: 'FOLDER', reportType: 'الميزانية', parentId: null }); setIsModalOpen(true); }} className="p-2.5 bg-primary text-white rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="relative mb-6">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
           <input type="text" placeholder="البحث في الدليل..." className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-4 pr-12 rounded-2xl font-bold outline-none text-sm shadow-inner focus:border-primary transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">{renderTree(null, 0)}</div>
      </div>

      <div className="lg:col-span-7">
         {selectedAccount ? (
           <div ref={movementsRef} className="space-y-6 animate-in slide-in-from-left-6 export-fix">
              <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-2xl flex justify-between items-center relative overflow-hidden no-print">
                 <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 blur-[100px] rounded-full"></div>
                 <div className="relative z-10 space-y-2">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] block mb-1">ACCOUNT ANALYSIS | تحليل الحساب</span>
                    <h2 className="text-5xl font-black text-readable italic tracking-tighter leading-none">{selectedAccount.name}</h2>
                    <div className="flex items-center gap-4 pt-4">
                       <span className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-mono font-black border border-white/10 shadow-lg">#{selectedAccount.code}</span>
                       <span className="px-5 py-2 bg-primary/10 text-primary rounded-xl text-xs font-black border border-primary/20 uppercase tracking-widest">{selectedAccount.reportType}</span>
                    </div>
                 </div>
                 <div className="text-left bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl relative z-10 min-w-[220px] print:bg-white print:border-zinc-300 print:shadow-none">
                    <span className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-widest print:text-zinc-600">NET BALANCE | الرصيد المتاح</span>
                    <div className={`text-5xl font-mono font-black ${calculateBalance(selectedAccount) >= 0 ? 'text-emerald-400' : 'text-rose-500'} print:text-black`}>{Math.abs(calculateBalance(selectedAccount)).toLocaleString()}</div>
                    <span className="text-xs font-bold text-zinc-600 uppercase mt-2 block tracking-widest print:text-zinc-500">{settings?.currencySymbol}</span>
                 </div>
              </div>

              <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
                 <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 no-print">
                    <h4 className="text-lg font-black text-readable flex items-center gap-3"><ArrowLeftRight className="w-6 h-6 text-primary" /> كشف حركات الحساب التفصيلي</h4>
                    <div className="flex gap-2">
                       <button onClick={() => { const data = accountMoves.map(m => ({ 'التاريخ': m.date, 'البيان': m.statement, 'مدين': m.debit, 'دائن': m.credit, 'المصدر': m.source })); exportToCSV(data, `كشف_${selectedAccount.name}`); }} className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Excel"><FileSpreadsheet className="w-5 h-5" /></button>
                       <button onClick={() => ImageExportService.exportAsPng(movementsRef.current!, `حساب_${selectedAccount.name}`)} className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-sm" title="صورة"><ImageIcon className="w-5 h-5" /></button>
                       <button onClick={() => window.print()} className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="طباعة"><Printer className="w-5 h-5" /></button>
                       <button onClick={() => setSelectedAccount(null)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-rose-500 transition-all shadow-sm"><X className="w-6 h-6" /></button>
                    </div>
                 </div>
                 <div className="max-h-[500px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                    {/* Print-only Header */}
                    <div className="hidden print:block mb-8 border-b-4 border-zinc-900 pb-6 text-center">
                       <h1 className="text-4xl font-black mb-2">كشف حركات الحساب التفصيلي</h1>
                       <div className="flex justify-center gap-8 text-xl font-bold">
                          <span>الحساب: {selectedAccount.name}</span>
                          <span>الكود: {selectedAccount.code}</span>
                          <span>التاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
                       </div>
                    </div>
                    <table className="w-full text-right border-collapse print:text-[11px]">
                       <thead>
                          <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase text-zinc-500 border-b dark:border-zinc-800 sticky top-0 z-10 h-14 print:bg-primary/5 print:text-primary print:border-b-2 print:border-primary">
                             <th className="p-4 border-l border-zinc-800 w-24 text-center print:border-zinc-300">التاريخ</th>
                             <th className="p-4 border-l border-zinc-800 print:border-zinc-300">البيان الرسمي</th>
                             <th className="p-4 border-l border-zinc-800 w-32 text-center print:border-zinc-300">الحساب الفرعي</th>
                             <th className="p-4 border-l border-zinc-800 w-32 text-center print:border-zinc-300">الحساب المقابل</th>
                             <th className="p-4 border-l border-zinc-800 w-20 text-center print:border-zinc-300">العملية</th>
                             <th className="p-4 border-l border-zinc-800 w-20 text-center print:border-zinc-300">رقم المستند</th>
                             <th className="p-4 text-center border-l border-zinc-800 bg-emerald-900/20 print:bg-emerald-50 print:border-primary/20">مدين (+)</th>
                             <th className="p-4 text-center border-l border-zinc-800 bg-rose-900/20 print:bg-rose-50 print:border-primary/20">دائن (-)</th>
                             <th className="p-4 text-center w-24">المستخدم</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y dark:divide-zinc-800 font-bold text-zinc-700 dark:text-zinc-300 print:divide-zinc-300">
                          {accountMoves.length === 0 ? (
                            <tr><td colSpan={9} className="p-32 text-center italic text-zinc-400 font-black text-2xl uppercase tracking-tighter">لا توجد حركات مسجلة حالياً لهذا الحساب</td></tr>
                          ) : accountMoves.map((m, i) => (
                             <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 h-16 transition-colors group cursor-pointer print:h-10" onClick={() => { setSelectedMove(m); setIsMoveDetailOpen(true); }}>
                                <td className="p-4 font-mono text-zinc-400 border-l border-zinc-50 dark:border-zinc-800 text-[10px] text-center print:text-black print:border-zinc-300">{m.date}</td>
                                <td className="p-4 text-readable border-l border-zinc-50 dark:border-zinc-800 text-xs leading-tight group-hover:text-primary print:text-black print:border-zinc-300">{m.statement}</td>
                                <td className="p-4 text-zinc-500 text-[10px] font-black border-l border-zinc-50 dark:border-zinc-800 text-center print:text-black print:border-zinc-300">{m.accountName || '-'}</td>
                                <td className="p-4 text-zinc-500 text-[10px] font-black italic border-l border-zinc-50 dark:border-zinc-800 text-center print:text-black print:border-zinc-300">{m.counterAccount || '-'}</td>
                                <td className="p-4 text-center border-l border-zinc-50 dark:border-zinc-800 print:border-zinc-300">
                                   <span className="text-[8px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black uppercase print:bg-transparent print:border print:border-zinc-300">{m.source}</span>
                                </td>
                                <td className="p-4 text-center font-mono text-zinc-400 text-[10px] border-l border-zinc-50 dark:border-zinc-800 print:text-black print:border-zinc-300">#{m.number}</td>
                                <td className="p-4 text-center font-mono text-emerald-600 border-l border-zinc-50 dark:border-zinc-800 text-base print:text-black print:border-zinc-300">{m.debit > 0 ? m.debit.toLocaleString() : '-'}</td>
                                <td className="p-4 text-center font-mono text-rose-600 border-l border-zinc-50 dark:border-zinc-800 text-base print:text-black print:border-zinc-300">{m.credit > 0 ? m.credit.toLocaleString() : '-'}</td>
                                <td className="p-4 text-center text-[9px] text-zinc-400 border-l border-zinc-50 dark:border-zinc-800 print:text-black">{m.user || '-'}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
         ) : (
           <div className="bg-white dark:bg-zinc-900/30 rounded-[4rem] h-[calc(100vh-180px)] flex flex-col items-center justify-center border-4 border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center shadow-inner">
              <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-8 animate-pulse"><History className="w-16 h-16 text-zinc-300 dark:text-zinc-600" /></div>
              <h3 className="text-3xl font-black text-zinc-300 uppercase tracking-[0.2em]">ACCOUNT DASHBOARD</h3>
              <p className="text-zinc-400 max-w-sm mt-4 font-bold text-lg leading-relaxed">يرجى اختيار أحد الحسابات الفرعية من الشجرة الجانبية لعرض تفاصيل الحركات. الحسابات الرئيسية (المجلدات) تستخدم للتنظيم وتراكم الأرصدة فقط.</p>
           </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[3rem] border border-zinc-200 shadow-2xl p-10 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8 border-b dark:border-zinc-800 pb-6">
                 <h3 className="text-3xl font-black text-readable tracking-tight">{modalMode === 'EDIT' ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><X className="w-8 h-8 text-zinc-400" /></button>
              </div>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">الكود المحاسبي</label>
                       <input type="text" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 p-4 rounded-2xl font-mono font-black text-center text-xl text-primary" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">نوع البند</label>
                       <select className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 p-4 rounded-2xl font-black appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                          <option value="FOLDER">مجموعة (رئيسي)</option>
                          <option value="ACCOUNT">حساب (فرعي)</option>
                       </select>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">اسم الحساب الكامل</label>
                    <input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-5 border-2 border-zinc-100 rounded-2xl font-black text-2xl text-readable outline-none focus:border-primary transition-all shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">نوع التقرير المرتبط</label>
                    <select className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 p-4 rounded-2xl font-black appearance-none cursor-pointer" value={formData.reportType} onChange={e => setFormData({...formData, reportType: e.target.value as any})}>
                       <option value="الميزانية">الميزانية العمومية</option>
                       <option value="المتاجرة">حساب المتاجرة</option>
                       <option value="الأرباح والخسائر">الأرباح والخسائر</option>
                    </select>
                 </div>
                 <button onClick={handleSaveNode} className="w-full bg-primary text-white py-6 rounded-[2rem] font-black shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-2xl mt-8 flex items-center justify-center gap-4"><Save className="w-8 h-8"/> حفظ وتثبيت البيانات</button>
              </div>
           </div>
        </div>
      )}

      {/* Account Details Popup Modal */}
      {isDetailPopupOpen && detailAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
              <div className="p-6 bg-zinc-900 text-white flex justify-between items-center border-b border-white/10">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
                       {detailAccount.type === 'FOLDER' ? <Folder className="w-6 h-6" /> : <Calculator className="w-6 h-6" />}
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight">بطاقة بيانات الحساب</h3>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Account Information</p>
                    </div>
                 </div>
                 <button onClick={() => setIsDetailPopupOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-zinc-400" />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700">
                       <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">رقم الحساب</span>
                       <p className="font-mono font-black text-lg text-primary">{detailAccount.code}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700">
                       <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">نوع البند</span>
                       <p className="font-black text-sm">{detailAccount.type === 'FOLDER' ? 'مجموعة رئيسية' : 'حساب فرعي'}</p>
                    </div>
                 </div>
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700">
                    <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">الاسم الكامل الرسمي</span>
                    <p className="font-black text-xl text-readable leading-tight italic">"{detailAccount.name}"</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900 text-white rounded-2xl border border-zinc-700 shadow-lg">
                       <span className="text-[10px] font-black text-zinc-500 uppercase block mb-1 tracking-widest">الرصيد الجاري المتاح</span>
                       <div className="flex items-baseline gap-1">
                          <p className={`font-mono font-black text-2xl ${calculateBalance(detailAccount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {Math.abs(calculateBalance(detailAccount)).toLocaleString()}
                          </p>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">{settings?.currencySymbol}</span>
                       </div>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700 flex flex-col justify-center items-center">
                       <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1 tracking-widest">إجمالي الحركات</span>
                       <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-zinc-300" />
                          <p className="font-black text-2xl text-readable">{getAccountMovements(detailAccount).length}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t dark:border-zinc-800 flex gap-2">
                 <button onClick={() => setIsDetailPopupOpen(false)} className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all">إغلاق المعاينة</button>
              </div>
           </div>
        </div>
      )}

      {/* Movement Detail Drill Down Modal */}
      {isMoveDetailOpen && selectedMove && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-zinc-900 text-white flex justify-between items-center border-b border-white/10">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl">
                       <FileStack className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight">تفاصيل الحركة المالية الكاملة</h3>
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{selectedMove.source} | #{selectedMove.number}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsMoveDetailOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-zinc-400" />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700">
                       <span className="text-[9px] font-black text-zinc-400 uppercase block mb-1 tracking-widest">تاريخ العملية الموثق</span>
                       <p className="font-mono font-black text-lg text-readable">{selectedMove.date}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700">
                       <span className="text-[9px] font-black text-zinc-400 uppercase block mb-1 tracking-widest">نوع المستند / القيد</span>
                       <p className="font-black text-lg text-primary">{selectedMove.source}</p>
                    </div>
                 </div>
                 <div className="p-5 bg-primary/5 rounded-[2rem] border-2 border-primary/20 space-y-4 shadow-inner">
                    <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                       <ArrowLeftRight className="w-4 h-4 text-primary" />
                       <span className="text-[10px] font-black text-primary uppercase tracking-widest">تحليل الطرف المقابل (Contra Account)</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-zinc-500">الحساب المقابل:</span>
                          <p className="text-xl font-black text-readable italic">"{selectedMove.counterAccount}"</p>
                       </div>
                       <div className="flex flex-col text-left">
                          <span className="text-[11px] font-bold text-zinc-500">تم بواسطة:</span>
                          <div className="flex items-center gap-1 justify-end text-zinc-900 dark:text-zinc-100">
                             <UserCircle className="w-3.5 h-3.5 opacity-50" />
                             <span className="font-black text-xs">{selectedMove.user || settings?.managerName || 'غير معرف'}</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center ${selectedMove.debit > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-50 border-zinc-100 opacity-40'}`}>
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">مدين (+) DEBIT</span>
                       <p className="text-3xl font-mono font-black text-emerald-600">{selectedMove.debit.toLocaleString()}</p>
                    </div>
                    <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center ${selectedMove.credit > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-zinc-50 border-zinc-100 opacity-40'}`}>
                       <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">دائن (-) CREDIT</span>
                       <p className="text-3xl font-mono font-black text-rose-600">{selectedMove.credit.toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700">
                    <span className="text-[9px] font-black text-zinc-400 uppercase block mb-1 tracking-widest">البيان الرسمي الكامل (Statement)</span>
                    <p className="text-sm font-bold text-readable italic leading-relaxed">"{selectedMove.statement}"</p>
                 </div>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t dark:border-zinc-800 flex justify-end gap-3 no-print">
                 <button onClick={() => window.print()} className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg"><Printer className="w-4 h-4"/> طباعة</button>
                 <button onClick={() => {
                   const data = [{
                     'التاريخ': selectedMove.date,
                     'البيان': selectedMove.statement,
                     'الحساب المقابل': selectedMove.counterAccount,
                     'مدين': selectedMove.debit,
                     'دائن': selectedMove.credit,
                     'المصدر': selectedMove.source,
                     'المستخدم': selectedMove.user
                   }];
                   exportToCSV(data, `حركة_${selectedMove.number}`);
                 }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg"><FileSpreadsheet className="w-4 h-4"/> تصدير Excel</button>
                 <button onClick={() => setIsMoveDetailOpen(false)} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-black text-xs">إغلاق</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsView;