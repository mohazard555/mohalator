
import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FolderPlus, ChevronRight, ChevronDown, 
  Search, Plus, Trash2, Edit2, X, Landmark, 
  ArrowLeftRight, Calculator, ImageIcon, FileSpreadsheet, Printer, Save, Package
} from 'lucide-react';
import { AccountNode, CashEntry, OpeningEntry, AppSettings, SalesInvoice, PurchaseInvoice, AccountingCategory, Party, PartyType, InventoryItem, StockEntry } from '../types';
import { ImageExportService } from '../utils/ImageExportService';
import { exportToCSV } from '../utils/export';

interface ChartOfAccountsViewProps {
  onBack?: () => void;
}

const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({ onBack }) => {
  const movementsRef = useRef<HTMLDivElement>(null);
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '11', '12', '2', '21', '211', '22', '3', '4', '5', '6', '7']));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  
  // مجموعات البيانات للمزامنة الحسابية
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [formData, setFormData] = useState<Partial<AccountNode>>({
    name: '', code: '', type: 'ACCOUNT', reportType: 'الميزانية', parentId: null
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const savedAccountsRaw = localStorage.getItem('sheno_chart_accounts');
    const sJou = localStorage.getItem('sheno_cash_journal');
    const sOp = localStorage.getItem('sheno_opening_entries');
    const sSal = localStorage.getItem('sheno_sales_invoices');
    const sPur = localStorage.getItem('sheno_purchases');
    const sCat = localStorage.getItem('sheno_accounting_categories');
    const sPar = localStorage.getItem('sheno_parties');
    const sInv = localStorage.getItem('sheno_inventory_list');
    const sSto = localStorage.getItem('sheno_stock_entries');
    const sSett = localStorage.getItem('sheno_settings');

    let savedAccounts: AccountNode[] = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : [];

    const defaultRoots: AccountNode[] = [
      // 1. الموجودات
      { id: '1', code: '1', name: 'الموجودات-الميزانية', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
      { id: '11', code: '11', name: 'الموجودات الثابتة-الميزانية', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '111', code: '111', name: 'مباني-الميزانية', parentId: '11', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '112', code: '112', name: 'عقارات-الميزانية', parentId: '11', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '113', code: '113', name: 'أثاث ومفروشات-الميزانية', parentId: '11', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '114', code: '114', name: 'سيارات-الميزانية', parentId: '11', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '12', code: '12', name: 'الموجودات المتداولة-الميزانية', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '121', code: '121', name: 'الزبائن-الميزانية', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '122', code: '122', name: 'مدينون مختلفون-الميزانية', parentId: '12', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '123', code: '123', name: 'مسحوبات الشركاء-الميزانية', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '124', code: '124', name: 'المخزون-الميزانية', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '1241', code: '1241', name: 'بضاعة أخر المدة-الميزانية', parentId: '124', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '13', code: '13', name: 'الأموال الجاهزة-الميزانية', parentId: '1', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '131', code: '131', name: 'الصندوق-الميزانية', parentId: '13', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '132', code: '132', name: 'مصرف النجمة-الميزانية', parentId: '13', type: 'ACCOUNT', reportType: 'الميزانية' },
      
      // 2. المطاليب
      { id: '2', code: '2', name: 'المطاليب-الميزانية', parentId: null, type: 'FOLDER', reportType: 'الميزانية' },
      { id: '21', code: '21', name: 'المطاليب الثابتة-الميزانية', parentId: '2', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '211', code: '211', name: 'رأس المال-الميزانية', parentId: '21', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '21101', code: '21101', name: 'رأسمال حسام-الميزانية', parentId: '211', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '21102', code: '21102', name: 'رأسمال أحمد-الميزانية', parentId: '211', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '212', code: '212', name: 'القروض-الميزانية', parentId: '21', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '22', code: '22', name: 'المطاليب المتداولة-الميزانية', parentId: '2', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '221', code: '221', name: 'الموردون-الميزانية', parentId: '22', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '221001', code: '221001', name: 'شركة الألبان المحدودة-الميزانية', parentId: '221', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '221002', code: '221002', name: 'شركة الأغذية الحديثة-الميزانية', parentId: '221', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '221003', code: '221003', name: 'شركة التضامن-الميزانية', parentId: '221', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '222', code: '222', name: 'دائنون مختلفون-الميزانية', parentId: '22', type: 'ACCOUNT', reportType: 'الميزانية' },

      // 3. صافي المشتريات
      { id: '3', code: '3', name: 'صافي المشتريات-المتاجرة', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
      { id: '31', code: '31', name: 'المشتريات-المتاجرة', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '32', code: '32', name: 'مرتجع المشتريات-المتاجرة', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '33', code: '33', name: 'مصاريف نقل المشتريات-المتاجرة', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '34', code: '34', name: 'الحسم المكتسب-المتاجرة', parentId: '3', type: 'ACCOUNT', reportType: 'المتاجرة' },

      // 4. صافي المبيعات
      { id: '4', code: '4', name: 'صافي المبيعات-المتاجرة', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
      { id: '41', code: '41', name: 'المبيعات-المتاجرة', parentId: '4', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '42', code: '42', name: 'مرتجع المبيعات-المتاجرة', parentId: '4', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '43', code: '43', name: 'الحسم الممنوح-المتاجرة', parentId: '4', type: 'ACCOUNT', reportType: 'المتاجرة' },

      // 5. المصاريف
      { id: '5', code: '5', name: 'المصاريف-الأرباح والخسائر', parentId: null, type: 'FOLDER', reportType: 'الأرباح والخسائر' },
      { id: '501', code: '501', name: 'رواتب واجور-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '502', code: '502', name: 'كهرباء وماء-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '503', code: '503', name: 'هاتف وفاكس وانترنيت-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '504', code: '504', name: 'إكراميات وهدايا-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '505', code: '505', name: 'نقل وانتقال-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '506', code: '506', name: 'وقود ومحروقات-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '507', code: '507', name: 'صيانة وقطع غيار-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '508', code: '508', name: 'قرطاسية ومطبوعات-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '509', code: '509', name: 'زيوت وشحوم-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '510', code: '510', name: 'مصاريف متفرقة-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },
      { id: '511', code: '511', name: 'معدات والات-الأرباح والخسائر', parentId: '5', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },

      // 6. الإيرادات
      { id: '6', code: '6', name: 'الايرادات-الأرباح والخسائر', parentId: null, type: 'FOLDER', reportType: 'الأرباح والخسائر' },
      { id: '601', code: '601', name: 'ايرادات مختلفة-الأرباح والخسائر', parentId: '6', type: 'ACCOUNT', reportType: 'الأرباح والخسائر' },

      // 7. البضاعة
      { id: '7', code: '7', name: 'البضاعة-المتاجرة', parentId: null, type: 'FOLDER', reportType: 'المتاجرة' },
      { id: '71', code: '71', name: 'بضاعة اول المدة-المتاجرة', parentId: '7', type: 'ACCOUNT', reportType: 'المتاجرة' },
      { id: '72', code: '72', name: 'بضاعة أخر المدة-المتاجرة', parentId: '7', type: 'ACCOUNT', reportType: 'المتاجرة' }
    ];

    if (savedAccounts.length === 0) {
      savedAccounts = defaultRoots;
    } else {
      defaultRoots.forEach(def => {
        if (!savedAccounts.some(acc => acc.id === def.id)) savedAccounts.push(def);
      });
    }

    setAccounts(savedAccounts);
    if (sJou) setJournal(JSON.parse(sJou));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    // Fix: Changed setAllSales to setSales as per state declaration
    if (sSal) setSales(JSON.parse(sSal));
    // Fix: Changed setAllPurchases to setPurchases as per state declaration
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sCat) setCategories(JSON.parse(sCat));
    // Fix: Changed setAllParties to setParties as per state declaration
    if (sPar) setParties(JSON.parse(sPar));
    if (sInv) setInventory(JSON.parse(sInv));
    if (sSto) setStockEntries(JSON.parse(sSto));
    if (sSett) setSettings(JSON.parse(sSett));
  };

  const syncAccountToModules = (account: AccountNode, oldName: string | null = null) => {
    // 1. مزامنة مع إدارة الجهات (زبائن وموردين)
    if (account.parentId === '121' || account.parentId === '221') {
      const type = account.parentId === '121' ? PartyType.CUSTOMER : PartyType.SUPPLIER;
      const sPar = localStorage.getItem('sheno_parties');
      let currentParties: Party[] = sPar ? JSON.parse(sPar) : [];
      const idx = currentParties.findIndex(p => p.name === (oldName || account.name));
      if (idx > -1) {
        currentParties[idx] = { ...currentParties[idx], name: account.name, code: account.code };
      } else {
        currentParties.push({ id: crypto.randomUUID(), code: account.code, name: account.name, phone: '', address: '', type, openingBalance: 0 });
      }
      localStorage.setItem('sheno_parties', JSON.stringify(currentParties));
    }

    // 2. مزامنة مع إدارة البنود (مصاريف وإيرادات)
    if (account.parentId === '5' || account.parentId === '6') {
      const type = account.parentId === '5' ? 'مصروفات' : 'إيرادات';
      const sCat = localStorage.getItem('sheno_accounting_categories');
      let currentCats: AccountingCategory[] = sCat ? JSON.parse(sCat) : [];
      const idx = currentCats.findIndex(c => c.name === (oldName || account.name));
      if (idx > -1) {
        currentCats[idx] = { ...currentCats[idx], name: account.name };
      } else {
        currentCats.push({ id: crypto.randomUUID(), name: account.name, type, notes: 'مضاف من الدليل' });
      }
      localStorage.setItem('sheno_accounting_categories', JSON.stringify(currentCats));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    let updated: AccountNode[];
    let oldName: string | null = null;

    if (modalMode === 'EDIT' && selectedAccount) {
      oldName = selectedAccount.name;
      const updatedNode = { ...selectedAccount, ...formData } as AccountNode;
      updated = accounts.map(a => a.id === selectedAccount.id ? updatedNode : a);
      syncAccountToModules(updatedNode, oldName);
    } else {
      const newNode = { ...formData, id: crypto.randomUUID() } as AccountNode;
      updated = [...accounts, newNode];
      syncAccountToModules(newNode);
    }

    setAccounts(updated);
    localStorage.setItem('sheno_chart_accounts', JSON.stringify(updated));
    setIsModalOpen(false);
    setSelectedAccount(null);
    loadAllData();
  };

  const calculateBalance = (account: AccountNode): number => {
    if (account.type === 'FOLDER') {
      const children = accounts.filter(a => a.parentId === account.id);
      return children.reduce((s, c) => s + calculateBalance(c), 0);
    }
    
    let balance = 0;
    // 1. القيد الافتتاحي
    const ops = openingEntries.filter(e => e.accountName === account.name);
    balance += ops.reduce((s, c) => s + (Number(c.debit) - Number(c.credit)), 0);

    // 2. النقدية (الصندوق)
    if (account.code === '131' || account.name.includes('الصندوق')) {
       balance += journal.reduce((s, c) => s + (Number(c.receivedSYP) - Number(c.paidSYP)), 0);
    }

    // 3. المخزون (بضاعة آخر المدة)
    if (account.code === '1241' || account.code === '72' || (account.name.includes('بضاعة') && account.name.includes('أخر'))) {
       balance = inventory.reduce((s, item) => {
          const moves = stockEntries.filter(e => e.itemCode === item.code);
          const currentQty = (item.openingStock || 0) + 
                            moves.filter(e => e.movementType === 'إدخال').reduce((sum, c) => sum + c.quantity, 0) - 
                            moves.filter(e => e.movementType === 'صرف').reduce((sum, c) => sum + c.quantity, 0) + 
                            moves.filter(e => e.movementType === 'مرتجع').reduce((sum, c) => sum + c.quantity, 0);
          return s + (currentQty * item.price);
       }, 0);
    }

    // 4. المبيعات العامة (كود 41)
    if (account.code === '41' || account.name.includes('المبيعات')) {
       // تجنب التكرار إذا كانت المبيعات كحساب رئيسي
       if (account.parentId === '4') balance += sales.reduce((s, c) => s + Number(c.totalAmount), 0);
    }
    // 5. المشتريات العامة (كود 31)
    if (account.code === '31' || account.name.includes('المشتريات')) {
       if (account.parentId === '3') balance -= purchases.reduce((s, c) => s + Number(c.totalAmount), 0);
    }

    // 6. الزبائن والموردين
    const isCustomer = parties.some(p => p.name === account.name && (p.type === PartyType.CUSTOMER || p.type === PartyType.BOTH));
    const isSupplier = parties.some(p => p.name === account.name && (p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH));

    if (isCustomer) {
       const pSales = sales.filter(s => s.customerName === account.name).reduce((s, c) => s + Number(c.totalAmount), 0);
       const pPaid = journal.filter(j => j.partyName === account.name || j.statement.includes(account.name)).reduce((s, c) => s + Number(c.receivedSYP), 0);
       balance += (pSales - pPaid);
    }
    if (isSupplier) {
       const pPurch = purchases.filter(p => p.supplierName === account.name).reduce((s, c) => s + Number(c.totalAmount), 0);
       const pPaid = journal.filter(j => j.partyName === account.name || j.statement.includes(account.name)).reduce((s, c) => s + Number(c.paidSYP), 0);
       balance -= (pPurch - pPaid);
    }

    // 7. المصاريف والإيرادات (إدارة البنود)
    const cat = categories.find(c => c.name === account.name);
    if (cat) {
       const moves = journal.filter(j => j.categoryId === cat.id);
       balance += moves.reduce((s, c) => s + (Number(c.receivedSYP) - Number(c.paidSYP)), 0);
    }

    return balance;
  };

  const getAccountMovements = (account: AccountNode) => {
    const moves: any[] = [];
    const name = account.name;
    const code = account.code;

    // حركات الصندوق واليومية
    journal.filter(j => 
       j.partyName === name || 
       j.statement.includes(name) || 
       (categories.find(c => c.name === name)?.id === j.categoryId) ||
       (code === '131' && (j.receivedSYP > 0 || j.paidSYP > 0))
    ).forEach(j => {
      moves.push({ date: j.date, statement: j.statement, debit: Number(j.receivedSYP) || 0, credit: Number(j.paidSYP) || 0, type: 'يومية' });
    });

    // حركات المبيعات
    sales.filter(s => s.customerName === name || (code === '41' && account.parentId === '4')).forEach(s => {
      moves.push({ date: s.date, statement: `فاتورة مبيع #${s.invoiceNumber}`, debit: Number(s.totalAmount), credit: 0, type: 'مبيعات' });
    });

    // حركات المشتريات
    purchases.filter(p => p.supplierName === name || (code === '31' && account.parentId === '3')).forEach(p => {
      moves.push({ date: p.date, statement: `فاتورة شراء #${p.invoiceNumber}`, debit: 0, credit: Number(p.totalAmount), type: 'مشتريات' });
    });

    // حركات المخزون التفصيلية لبضاعة آخر المدة
    if (code === '1241' || code === '72') {
       inventory.forEach(item => {
          const itemMoves = stockEntries.filter(e => e.itemCode === item.code);
          const added = itemMoves.filter(e => e.movementType === 'إدخال').reduce((s, c) => s + c.quantity, 0);
          const out = itemMoves.filter(e => e.movementType === 'صرف').reduce((s, c) => s + c.quantity, 0);
          const ret = itemMoves.filter(e => e.movementType === 'مرتجع').reduce((s, c) => s + c.quantity, 0);
          const balance = (item.openingStock || 0) + added - out + ret;
          if (balance !== 0) {
             moves.push({ 
                date: new Date().toISOString().split('T')[0], 
                statement: `مادة في المخزن: ${item.name} (${balance} ${item.unit})`, 
                debit: balance > 0 ? balance * item.price : 0, 
                credit: balance < 0 ? Math.abs(balance * item.price) : 0, 
                type: 'مخزون' 
             });
          }
       });
    }

    // حركات القيود الافتتاحية
    openingEntries.filter(e => e.accountName === name).forEach(e => {
       moves.push({ date: e.date, statement: 'رصيد افتتاحي ميزانية', debit: e.debit, credit: e.credit, type: 'افتتاحي' });
    });

    return moves.sort((a, b) => b.date.localeCompare(a.date));
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNodes(newExpanded);
  };

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    const nodes = accounts.filter(a => a.parentId === parentId).sort((a, b) => a.code.localeCompare(b.code));
    return nodes.map(node => {
        const isExpanded = expandedNodes.has(node.id);
        const balance = calculateBalance(node);
        const children = accounts.filter(a => a.parentId === node.id);
        if (searchTerm && !node.name.includes(searchTerm) && !node.code.includes(searchTerm)) return null;

        return (
          <div key={node.id} className="select-none">
            <div 
              className={`flex items-center py-2 px-3 rounded-xl transition-all cursor-pointer group ${selectedAccount?.id === node.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              onClick={() => setSelectedAccount(node)}
            >
              <div style={{ width: `${level * 20}px` }}></div>
              <button onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }} className="p-1 text-zinc-400">
                {children.length > 0 ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4" />}
              </button>
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {node.type === 'FOLDER' ? <Folder className="w-4 h-4 text-amber-500 shrink-0" /> : <Calculator className="w-3.5 h-3.5 text-primary shrink-0 opacity-40" />}
                <div className="flex items-center gap-2 truncate">
                   <span className="font-mono text-zinc-400 text-[9px]">{node.code}</span>
                   <span className="font-black text-readable text-xs">{node.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <span className={`font-mono text-[10px] font-black ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{balance !== 0 ? balance.toLocaleString() : ''}</span>
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 no-print">
                    <button onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, parentId: node.id, type: 'ACCOUNT' }); setIsModalOpen(true); setModalMode('ADD'); }} className="p-1 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-500 hover:text-primary"><Plus className="w-3 h-3"/></button>
                    <button onClick={(e) => { e.stopPropagation(); setFormData(node); setModalMode('EDIT'); setIsModalOpen(true); }} className="p-1 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-500 hover:text-amber-500"><Edit2 className="w-3 h-3"/></button>
                    {!['1','2','3','4','5','6','7'].includes(node.id) && (
                      <button onClick={(e) => { e.stopPropagation(); if(window.confirm('حذف الحساب؟')) { setAccounts(accounts.filter(a=>a.id!==node.id)); setSelectedAccount(null); }}} className="p-1 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-500 hover:text-rose-500"><Trash2 className="w-3 h-3"/></button>
                    )}
                 </div>
              </div>
            </div>
            {isExpanded && <div className="mr-3 border-r border-zinc-100 dark:border-zinc-800">{renderTree(node.id, level + 1)}</div>}
          </div>
        );
      });
  };

  const accountMoves = selectedAccount ? getAccountMovements(selectedAccount) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 h-[calc(100vh-200px)]">
      <div className={`lg:col-span-5 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col no-print ${selectedAccount ? 'print:hidden' : ''}`}>
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-xl font-black text-readable flex items-center gap-2"><Landmark className="w-6 h-6 text-primary" /> دليل الحسابات</h3>
           <button onClick={() => { setModalMode('ADD'); setFormData({ name: '', code: '', type: 'FOLDER', reportType: 'الميزانية', parentId: null }); setIsModalOpen(true); }} className="p-2 bg-primary text-white rounded-xl shadow-lg"><FolderPlus className="w-5 h-5" /></button>
        </div>
        <div className="relative mb-4">
           <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
           <input type="text" placeholder="بحث..." className="w-full bg-zinc-50 dark:bg-zinc-900 border p-3 pr-10 rounded-2xl font-bold outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">{renderTree(null, 0)}</div>
      </div>

      <div className={`lg:col-span-7 flex flex-col space-y-6 ${selectedAccount ? 'print:col-span-12' : ''}`}>
         {selectedAccount ? (
           <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-left-4">
              <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden shrink-0 print:border-none print:shadow-none">
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">تفاصيل الحساب</span>
                       <h2 className="text-3xl font-black text-readable italic">{selectedAccount.name}</h2>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-mono font-black border dark:border-zinc-700">الكود: {selectedAccount.code}</span>
                          <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black border border-rose-500/20">{selectedAccount.reportType}</span>
                       </div>
                    </div>
                    <div className="text-left">
                       <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">الرصيد الجاري</span>
                       <div className={`text-4xl font-mono font-black ${calculateBalance(selectedAccount) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{calculateBalance(selectedAccount).toLocaleString()}</div>
                       <span className="text-[10px] font-bold text-zinc-400 uppercase">{settings?.currencySymbol}</span>
                    </div>
                 </div>
              </div>

              <div ref={movementsRef} className="bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none print:p-0 export-fix">
                 <div className="flex items-center justify-between mb-6 border-b dark:border-zinc-800 pb-4 no-print">
                    <h4 className="font-black text-readable flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-primary" /> كشف الحركات المالي والمخزني</h4>
                    <div className="flex gap-2">
                       <button onClick={() => exportToCSV(accountMoves, 'ledger')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl shadow-sm"><FileSpreadsheet className="w-5 h-5" /></button>
                       <button onClick={() => ImageExportService.exportAsPng(movementsRef.current!, 'ledger')} className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shadow-sm"><ImageIcon className="w-5 h-5" /></button>
                       <button onClick={() => window.print()} className="p-2 bg-rose-500/10 text-rose-600 rounded-xl shadow-sm"><Printer className="w-5 h-5" /></button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse text-sm">
                       <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-black uppercase text-zinc-400 sticky top-0 z-10 h-12 border-b dark:border-zinc-800 print:bg-zinc-100 print:text-zinc-900">
                             <th className="p-4 border-l dark:border-zinc-800">التاريخ</th><th className="p-4 border-l dark:border-zinc-800">البيان الرسمي</th><th className="p-4 text-center border-l dark:border-zinc-800">مدين (+)</th><th className="p-4 text-center border-l dark:border-zinc-800">دائن (-)</th><th className="p-4 text-center">النوع</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y dark:divide-zinc-800 font-bold print:text-zinc-900">
                          {accountMoves.map((m, i) => (
                             <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 h-14 transition-colors">
                                <td className="p-4 font-mono text-zinc-400 border-l dark:border-zinc-800">{m.date}</td><td className="p-4 text-readable border-l dark:border-zinc-800">{m.statement}</td><td className="p-4 text-center font-mono text-emerald-600 border-l dark:border-zinc-800">{m.debit > 0 ? m.debit.toLocaleString() : '-'}</td><td className="p-4 text-center font-mono text-rose-500 border-l dark:border-zinc-800">{m.credit > 0 ? m.credit.toLocaleString() : '-'}</td><td className="p-4 text-center"><span className="text-[8px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md font-black uppercase print:border print:bg-white">{m.type}</span></td>
                             </tr>
                          ))}
                          {accountMoves.length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center italic text-zinc-300 font-bold">لا توجد حركات مسجلة</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
         ) : (
           <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-[3rem] h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center animate-pulse">
              <Landmark className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mb-6" />
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-widest">اختر حساباً لمشاهدة التفاصيل</h3>
              <p className="text-zinc-400 mt-2 font-bold italic">الأرصدة تتحدث تلقائياً من كافة موديولات النظام.</p>
           </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8 border-b dark:border-zinc-800 pb-4">
                 <h3 className="text-xl font-black text-readable">{modalMode === 'EDIT' ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد بالدليل'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">الكود المحاسبي</label><input type="text" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-mono font-black" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">نوع البند</label><select className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="FOLDER">مجلد رئيسي</option><option value="ACCOUNT">حساب فرعي</option></select></div>
                 </div>
                 <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">اسم الحساب الرسمي</label><input type="text" className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                 <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">نوع التقرير الختامي</label><select className="bg-zinc-50 dark:bg-zinc-950 border p-3 rounded-xl font-bold" value={formData.reportType} onChange={e => setFormData({...formData, reportType: e.target.value as any})}><option value="الميزانية">الميزانية العمومية</option><option value="المتاجرة">حساب المتاجرة</option><option value="الأرباح والخسائر">الأرباح والخسائر</option></select></div>
                 <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg mt-4 flex items-center justify-center gap-2"><Save className="w-5 h-5"/> حفظ ومزامنة البيانات</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsView;
