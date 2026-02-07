
import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FolderPlus, ChevronRight, ChevronDown, 
  Search, Plus, Trash2, Edit2, X, Landmark, 
  ArrowLeftRight, Calculator, ImageIcon, FileSpreadsheet, Printer, Save, History
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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '11', '12', '2', '21', '22', '3', '4', '5', '6', '7']));
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
      { id: '121001', code: '121001', name: 'زبون رقم 1-الميزانية', parentId: '121', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '122', code: '122', name: 'مدينون مختلفون-الميزانية', parentId: '12', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '123', code: '123', name: 'مسحوبات الشركاء-الميزانية', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '12301', code: '12301', name: 'مسحوبات الشريك 1-الميزانية', parentId: '123', type: 'ACCOUNT', reportType: 'الميزانية' },
      { id: '124', code: '124', name: 'المخزون-الميزانية', parentId: '12', type: 'FOLDER', reportType: 'الميزانية' },
      { id: '1241', code: '1241', name: 'مخزون بضاعة جاهزة أخر المدة-الميزانية', parentId: '124', type: 'ACCOUNT', reportType: 'الميزانية' },
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

    let currentAccounts: AccountNode[] = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : defaultRoots;
    
    // حقن الأقسام الافتراضية إذا فقدت
    defaultRoots.forEach(def => {
      if (!currentAccounts.some(acc => acc.id === def.id)) currentAccounts.push(def);
    });

    setAccounts(currentAccounts);
    if (sJou) setJournal(JSON.parse(sJou));
    if (sOp) setOpeningEntries(JSON.parse(sOp));
    if (sSal) setSales(JSON.parse(sSal));
    if (sPur) setPurchases(JSON.parse(sPur));
    if (sCat) setCategories(JSON.parse(sCat));
    if (sPar) setParties(JSON.parse(sPar));
    if (sInv) setInventory(JSON.parse(sInv));
    if (sSto) setStockEntries(JSON.parse(sSto));
    if (sSett) setSettings(JSON.parse(sSett));
  };

  const calculateBalance = (account: AccountNode): number => {
    if (account.type === 'FOLDER') {
      const children = accounts.filter(a => a.parentId === account.id);
      return children.reduce((s, c) => s + calculateBalance(c), 0);
    }
    
    let balance = 0;
    const name = account.name;
    const code = account.code;

    // 1. الرصيد الافتتاحي من الميزانية العمومية
    const ops = openingEntries.filter(e => e.accountName === name || name.includes(e.accountName));
    balance += ops.reduce((s, c) => s + (Number(c.debit) - Number(c.credit)), 0);

    // 2. النقدية (الصناديق)
    if (code === '131' || name.includes('الصندوق')) {
       balance += journal.reduce((s, c) => s + (Number(c.receivedSYP) - Number(c.paidSYP)), 0);
    }

    // 3. الزبائن والموردين
    const party = parties.find(p => name.includes(p.name));
    if (party) {
       if (party.type === PartyType.CUSTOMER || party.type === PartyType.BOTH) {
          const pSales = sales.filter(s => s.customerName === party.name).reduce((s, c) => s + c.totalAmount, 0);
          const pRec = journal.filter(j => j.partyName === party.name).reduce((s, c) => s + c.receivedSYP, 0);
          balance += (pSales - pRec);
       }
       if (party.type === PartyType.SUPPLIER || party.type === PartyType.BOTH) {
          const pPurch = purchases.filter(p => p.supplierName === party.name).reduce((s, c) => s + c.totalAmount, 0);
          const pPaid = journal.filter(j => j.partyName === party.name).reduce((s, c) => s + c.paidSYP, 0);
          balance -= (pPurch - pPaid);
       }
    }

    // 4. بنود المصاريف والايرادات
    const cat = categories.find(c => name.includes(c.name));
    if (cat) {
       const moves = journal.filter(j => j.categoryId === cat.id);
       if (cat.type === 'مصروفات') balance += moves.reduce((s, c) => s + c.paidSYP, 0);
       else balance += moves.reduce((s, c) => s + c.receivedSYP, 0);
    }

    // 5. المبيعات والمشتريات
    if (code === '41' || name.includes('المبيعات')) {
       if (account.parentId === '4') balance += sales.reduce((s, c) => s + c.totalAmount, 0);
    }
    if (code === '31' || name.includes('المشتريات')) {
       if (account.parentId === '3') balance -= purchases.reduce((s, c) => s + c.totalAmount, 0);
    }

    // 6. المخزون (بضاعة آخر المدة)
    if (code === '72' || code === '1241' || (name.includes('بضاعة') && name.includes('أخر'))) {
       const stockVal = inventory.reduce((s, item) => {
          const moves = stockEntries.filter(e => e.itemCode === item.code);
          const bal = (item.openingStock || 0) + 
                     moves.filter(e => e.movementType === 'إدخال').reduce((sum, c) => sum + c.quantity, 0) - 
                     moves.filter(e => e.movementType === 'صرف').reduce((sum, c) => sum + c.quantity, 0) + 
                     moves.filter(e => e.movementType === 'مرتجع').reduce((sum, c) => sum + c.quantity, 0);
          return s + (bal * item.price);
       }, 0);
       balance = stockVal;
    }

    return balance;
  };

  const getAccountMovements = (account: AccountNode) => {
    const moves: any[] = [];
    const name = account.name;

    // البحث في الصندوق
    journal.filter(j => j.partyName === name || j.statement.includes(name) || categories.find(c => name.includes(c.name))?.id === j.categoryId || (account.code === '131' && (j.receivedSYP > 0 || j.paidSYP > 0)))
      .forEach(j => {
        moves.push({ date: j.date, statement: j.statement, debit: j.receivedSYP || 0, credit: j.paidSYP || 0, source: 'الصندوق' });
      });

    // البحث في المبيعات
    sales.filter(s => s.customerName === name || (account.parentId === '4'))
      .forEach(s => {
        moves.push({ date: s.date, statement: `فاتورة مبيع #${s.invoiceNumber}`, debit: s.totalAmount, credit: 0, source: 'المبيعات' });
      });

    // البحث في المشتريات
    purchases.filter(p => p.supplierName === name || (account.parentId === '3'))
      .forEach(p => {
        moves.push({ date: p.date, statement: `فاتورة شراء #${p.invoiceNumber}`, debit: 0, credit: p.totalAmount, source: 'المشتريات' });
      });

    // القيود الافتتاحية
    openingEntries.filter(e => name.includes(e.accountName)).forEach(e => {
       moves.push({ date: e.date, statement: 'قيد ميزانية افتتاحي', debit: e.debit, credit: e.credit, source: 'المركز المالي' });
    });

    return moves.sort((a, b) => b.date.localeCompare(a.date));
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    const newNode = { ...formData, id: modalMode === 'EDIT' ? selectedAccount!.id : crypto.randomUUID() } as AccountNode;
    const updated = modalMode === 'EDIT' 
      ? accounts.map(a => a.id === selectedAccount!.id ? newNode : a)
      : [...accounts, newNode];

    setAccounts(updated);
    localStorage.setItem('sheno_chart_accounts', JSON.stringify(updated));
    setIsModalOpen(false);
    setSelectedAccount(null);
    loadAllData();
  };

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    const nodes = accounts.filter(a => a.parentId === parentId).sort((a, b) => a.code.localeCompare(b.code));
    return nodes.map(node => {
        const isExpanded = expandedNodes.has(node.id);
        const bal = calculateBalance(node);
        const children = accounts.filter(a => a.parentId === node.id);
        if (searchTerm && !node.name.includes(searchTerm) && !node.code.includes(searchTerm)) return null;

        return (
          <div key={node.id} className="select-none">
            <div 
              className={`flex items-center py-2.5 px-4 rounded-2xl transition-all cursor-pointer group mb-1 ${selectedAccount?.id === node.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              onClick={() => setSelectedAccount(node)}
            >
              <div style={{ width: `${level * 24}px` }}></div>
              <button onClick={(e) => { e.stopPropagation(); const n = new Set(expandedNodes); if(n.has(node.id)) n.delete(node.id); else n.add(node.id); setExpandedNodes(n); }} className="p-1 text-zinc-400">
                {children.length > 0 ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4" />}
              </button>
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {node.type === 'FOLDER' ? <Folder className="w-4 h-4 text-amber-500" /> : <Calculator className="w-3.5 h-3.5 text-primary opacity-40" />}
                <div className="flex flex-col truncate">
                   <span className="font-black text-readable text-[11px] leading-tight">{node.name}</span>
                   <span className="font-mono text-zinc-400 text-[8px] uppercase">ID: {node.code}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <span className={`font-mono text-[11px] font-black ${bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{bal !== 0 ? bal.toLocaleString() : '-'}</span>
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 no-print transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, parentId: node.id, type: 'ACCOUNT' }); setModalMode('ADD'); setIsModalOpen(true); }} className="p-1.5 bg-white dark:bg-zinc-700 rounded-lg text-zinc-400 hover:text-primary shadow-sm"><Plus className="w-3.5 h-3.5"/></button>
                    <button onClick={(e) => { e.stopPropagation(); setFormData(node); setModalMode('EDIT'); setIsModalOpen(true); }} className="p-1.5 bg-white dark:bg-zinc-700 rounded-lg text-zinc-400 hover:text-amber-500 shadow-sm"><Edit2 className="w-3.5 h-3.5"/></button>
                 </div>
              </div>
            </div>
            {isExpanded && <div className="mr-4 border-r-2 border-zinc-100 dark:border-zinc-800">{renderTree(node.id, level + 1)}</div>}
          </div>
        );
      });
  };

  const accountMoves = selectedAccount ? getAccountMovements(selectedAccount) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className={`lg:col-span-4 bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[calc(100vh-180px)] no-print`}>
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-black text-readable">شجرة الحسابات الأصلية</h3>
           </div>
           <button onClick={() => { setModalMode('ADD'); setFormData({ name: '', code: '', type: 'FOLDER', reportType: 'الميزانية', parentId: null }); setIsModalOpen(true); }} className="p-2 bg-primary text-white rounded-xl shadow-lg"><FolderPlus className="w-5 h-5" /></button>
        </div>
        <div className="relative mb-6">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
           <input type="text" placeholder="بحث في الدليل..." className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 pr-12 rounded-2xl font-bold outline-none text-sm shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">{renderTree(null, 0)}</div>
      </div>

      <div className="lg:col-span-8">
         {selectedAccount ? (
           <div ref={movementsRef} className="space-y-6 animate-in slide-in-from-left-6 export-fix">
              <div className="bg-white dark:bg-zinc-950 p-8 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex justify-between items-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                 <div className="relative z-10">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">تفصيل الرصيد والمصدر</span>
                    <h2 className="text-4xl font-black text-readable italic tracking-tight">{selectedAccount.name}</h2>
                    <div className="flex items-center gap-3 mt-3">
                       <span className="px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-[11px] font-mono font-black border border-white/10 shadow-lg">كود: {selectedAccount.code}</span>
                       <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-[11px] font-black border border-primary/20">{selectedAccount.reportType}</span>
                    </div>
                 </div>
                 <div className="text-left bg-zinc-50 dark:bg-zinc-900 p-6 rounded-[2rem] border dark:border-zinc-800 shadow-inner relative z-10">
                    <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">الرصيد الصافي المتاح</span>
                    <div className={`text-4xl font-mono font-black ${calculateBalance(selectedAccount) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{calculateBalance(selectedAccount).toLocaleString()}</div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase mt-1 block">{settings?.currencySymbol}</span>
                 </div>
              </div>

              <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
                 <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 no-print">
                    <h4 className="font-black text-readable flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-primary" /> كشف حركات الحساب التفصيلي</h4>
                    <div className="flex gap-2">
                       <button onClick={() => exportToCSV(accountMoves, `كشف_${selectedAccount.name}`)} className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><FileSpreadsheet className="w-5 h-5" /></button>
                       <button onClick={() => ImageExportService.exportAsPng(movementsRef.current!, `حساب_${selectedAccount.name}`)} className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"><ImageIcon className="w-5 h-5" /></button>
                       <button onClick={() => window.print()} className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Printer className="w-5 h-5" /></button>
                       <button onClick={() => setSelectedAccount(null)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-rose-500 transition-all shadow-sm"><X className="w-5 h-5" /></button>
                    </div>
                 </div>
                 <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse text-sm">
                       <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-black uppercase text-zinc-500 border-b dark:border-zinc-800 sticky top-0 z-10 h-14 print:bg-zinc-100 print:text-black">
                             <th className="p-4 border-l dark:border-zinc-800">التاريخ</th>
                             <th className="p-4 border-l dark:border-zinc-800">البيان الرسمي</th>
                             <th className="p-4 text-center border-l dark:border-zinc-800 bg-emerald-500/5">مدين (+)</th>
                             <th className="p-4 text-center border-l dark:border-zinc-800 bg-rose-500/5">دائن (-)</th>
                             <th className="p-4 text-center">المصدر</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y dark:divide-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
                          {accountMoves.length === 0 ? (
                            <tr><td colSpan={5} className="p-32 text-center italic text-zinc-300 font-black text-2xl uppercase tracking-tighter">لا توجد حركات مسجلة لهذا الحساب</td></tr>
                          ) : accountMoves.map((m, i) => (
                             <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 h-16 transition-colors">
                                <td className="p-4 font-mono text-zinc-400 border-l dark:border-zinc-800">{m.date}</td>
                                <td className="p-4 text-readable border-l dark:border-zinc-800">{m.statement}</td>
                                <td className="p-4 text-center font-mono text-emerald-600 border-l dark:border-zinc-800 text-lg">{m.debit > 0 ? m.debit.toLocaleString() : '-'}</td>
                                <td className="p-4 text-center font-mono text-rose-600 border-l dark:border-zinc-800 text-lg">{m.credit > 0 ? m.credit.toLocaleString() : '-'}</td>
                                <td className="p-4 text-center text-[10px] text-zinc-400 font-black uppercase">{m.source}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
         ) : (
           <div className="bg-zinc-50 dark:bg-zinc-900/30 rounded-[4rem] h-[calc(100vh-180px)] flex flex-col items-center justify-center border-4 border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center animate-pulse duration-[3000ms]">
              <History className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mb-6" />
              <h3 className="text-2xl font-black text-zinc-300 uppercase tracking-widest">اختر حساباً للتحليل الذكي</h3>
              <p className="text-zinc-400 max-w-sm mt-2 font-bold italic opacity-60">سيتم تجميع بياناتك المالية من كافة أقسام النظام وعرضها بشكل لحظي وبدقة متناهية.</p>
           </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-10 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8 border-b dark:border-zinc-800 pb-5">
                 <h3 className="text-2xl font-black text-readable">{modalMode === 'EDIT' ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد بالدليل'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-rose-500 transition-all"><X className="w-8 h-8"/></button>
              </div>
              <div className="space-y-5">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">الكود المحاسبي</label><input type="text" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-mono font-black text-center" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">نوع البند</label><select className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-bold appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}><option value="FOLDER">مجلد رئيسي</option><option value="ACCOUNT">حساب فرعي</option></select></div>
                 </div>
                 <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">اسم الحساب الرسمي</label><input type="text" className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-black text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                 <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase mr-2">نوع التقرير الختامي</label><select className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl font-bold appearance-none cursor-pointer" value={formData.reportType} onChange={e => setFormData({...formData, reportType: e.target.value as any})}><option value="الميزانية">الميزانية العمومية</option><option value="المتاجرة">حساب المتاجرة</option><option value="الأرباح والخسائر">الأرباح والخسائر</option></select></div>
                 <button onClick={handleSave} className="w-full bg-primary text-white py-5 rounded-[2rem] font-black shadow-2xl hover:scale-105 transition-all text-xl mt-6 flex items-center justify-center gap-3"><Save className="w-6 h-6"/> حفظ ومزامنة البيانات</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsView;
