
import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Edit2, Search, Users, Building2, Save, X, Phone, MapPin, Printer, Calendar, FileDown, Wallet, Calculator } from 'lucide-react';
import { Party, PartyType, AppSettings, AccountNode, SalesInvoice, PurchaseInvoice, CashEntry } from '../types';
import { exportToCSV } from '../utils/export';

interface PartyManagementViewProps {
  onBack: () => void;
}

const PartyManagementView: React.FC<PartyManagementViewProps> = ({ onBack }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [journal, setJournal] = useState<CashEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [filterType, setFilterType] = useState<'الكل' | PartyType | 'عميل ومورد'>('الكل');
  
  const [formData, setFormData] = useState<Partial<Party>>({ 
    name: '', code: '', phone: '', address: '', type: PartyType.CUSTOMER, openingBalance: 0 
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSales = localStorage.getItem('sheno_sales_invoices');
    const savedPurchases = localStorage.getItem('sheno_purchases');
    const savedJournal = localStorage.getItem('sheno_cash_journal');
    const savedSettings = localStorage.getItem('sheno_settings');

    if (savedParties) setParties(JSON.parse(savedParties));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
    if (savedJournal) setJournal(JSON.parse(savedJournal));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  };

  const calculatePartyBalance = (party: Party) => {
    // 1. الرصيد الافتتاحي
    let balance = party.openingBalance || 0;

    // 2. المبيعات (مدين +)
    const partySales = sales.filter(s => s.customerName === party.name);
    balance += partySales.reduce((s, c) => s + c.totalAmount, 0);

    // 3. المشتريات (دائن -)
    const partyPurchases = purchases.filter(p => p.supplierName === party.name);
    balance -= partyPurchases.reduce((s, c) => s + c.totalAmount, 0);

    // 4. المقبوضات والمدفوعات من اليومية
    const partyCash = journal.filter(j => j.partyName === party.name || j.statement.includes(party.name));
    partyCash.forEach(j => {
      // إذا قبضنا من زبون (رصيده ينقص -)
      balance -= (j.receivedSYP || 0);
      balance -= (j.receivedUSD || 0); // للتبسيط هنا نجمع العملات، يفضل فصلها في كشوف تفصيلية

      // إذا دفعنا لمورد (رصيده ينقص كمطلوب منه +)
      balance += (j.paidSYP || 0);
      balance += (j.paidUSD || 0);
    });

    return balance;
  };

  const syncToChartOfAccounts = (party: Party, isDelete: boolean = false) => {
    const savedChart = localStorage.getItem('sheno_chart_accounts');
    if (!savedChart) return;
    
    let chart: AccountNode[] = JSON.parse(savedChart);
    const parentId = party.type === PartyType.SUPPLIER ? '221' : '121'; 

    if (isDelete) {
      chart = chart.filter(acc => acc.name !== party.name);
    } else {
      const existingIdx = chart.findIndex(acc => acc.name === party.name);
      const accountData: AccountNode = {
        id: editingId ? (chart[existingIdx]?.id || crypto.randomUUID()) : crypto.randomUUID(),
        code: party.code ? `ACC-${party.code}` : `ACC-${Math.floor(Math.random() * 1000)}`,
        name: party.name,
        parentId: parentId,
        type: 'ACCOUNT',
        reportType: 'الميزانية'
      };

      if (existingIdx > -1) chart[existingIdx] = accountData;
      else chart.push(accountData);
    }

    localStorage.setItem('sheno_chart_accounts', JSON.stringify(chart));
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    let updated: Party[];
    const partyToSave = { ...formData, id: editingId || crypto.randomUUID() } as Party;

    if (editingId) {
      updated = parties.map(p => p.id === editingId ? partyToSave : p);
    } else {
      updated = [...parties, partyToSave];
    }

    setParties(updated);
    localStorage.setItem('sheno_parties', JSON.stringify(updated));
    syncToChartOfAccounts(partyToSave);
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', code: '', phone: '', address: '', type: PartyType.CUSTOMER, openingBalance: 0 });
    loadAllData();
  };

  const handleDelete = (id: string) => {
    const party = parties.find(p => p.id === id);
    if (party && window.confirm('حذف هذا الحساب نهائياً من النظام والدليل؟')) {
      const updated = parties.filter(x => x.id !== id);
      setParties(updated);
      localStorage.setItem('sheno_parties', JSON.stringify(updated));
      syncToChartOfAccounts(party, true);
    }
  };

  const handleExportExcel = () => {
    const data = filteredParties.map(p => ({
      'كود الحساب': p.code,
      'الاسم': p.name,
      'النوع': p.type,
      'الهاتف': p.phone,
      'العنوان': p.address,
      'الرصيد الافتتاحي': p.openingBalance,
      'الرصيد الحالي': calculatePartyBalance(p)
    }));
    exportToCSV(data, 'parties_list');
  };

  const filteredParties = parties.filter(p => {
    const nameStr = p.name || '';
    const codeStr = p.code || '';
    const matchSearch = nameStr.includes(searchTerm) || codeStr.includes(searchTerm);
    const matchType = filterType === 'الكل' || p.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Print Only Header */}
      <div className="print-only mb-6 border-b-4 border-primary pb-6 flex justify-between items-center bg-white text-black p-4 rounded-xl">
        <div className="flex items-center gap-4">
          {settings?.logoUrl && <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="Logo" />}
          <div>
            <h1 className="text-2xl font-black text-primary leading-none">{settings?.companyName}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{settings?.companyType}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black underline underline-offset-8 decoration-primary/30">سجل العملاء والموردين المعتمد</h2>
          <p className="text-xs mt-3 font-bold flex items-center justify-center gap-2 uppercase tracking-widest text-zinc-400">قائمة الجهات وحساباتها الجارية</p>
        </div>
        <div className="text-left text-xs font-bold text-zinc-500">
          <p>{settings?.address}</p>
          <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors shadow-sm">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">إدارة العملاء والموردين</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-emerald-500 transition-all">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
          <button onClick={() => window.print()} className="bg-zinc-100 dark:bg-zinc-800 text-readable border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-sm transition-all hover:bg-zinc-200">
             <Printer className="w-5 h-5" /> طباعة السجل
          </button>
          <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
            <Plus className="w-5 h-5" /> إضافة حساب جديد
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 no-print text-readable">
           <h3 className="text-lg font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> {editingId ? 'تعديل بيانات الحساب' : 'تسجيل حساب جديد'}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">الاسم الكامل</label><input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 font-bold outline-none focus:border-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">كود الحساب</label><input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 font-mono font-bold" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
              <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-zinc-500 font-black uppercase">النوع</label>
                 <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 font-bold outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as PartyType})}>
                    <option value={PartyType.CUSTOMER}>عميل</option>
                    <option value={PartyType.SUPPLIER}>مورد</option>
                    <option value={PartyType.BOTH}>عميل ومورد</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">رصيد أول المدة</label><input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 font-mono font-black text-rose-600" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">رقم الهاتف</label><input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-zinc-500 font-black uppercase">العنوان</label><input type="text" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
           </div>
           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">حفظ وتثبيت البيانات</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-8 py-3 rounded-2xl font-bold">إلغاء</button>
           </div>
        </div>
      )}

      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center shadow-sm no-print">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input type="text" placeholder="البحث باسم الحساب أو الكود..." className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pr-12 pl-4 outline-none font-bold text-readable focus:ring-2 focus:ring-primary transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
           <button onClick={() => setFilterType('الكل')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filterType === 'الكل' ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 text-zinc-400 border'}`}>الكل</button>
           <button onClick={() => setFilterType(PartyType.CUSTOMER)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filterType === PartyType.CUSTOMER ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 text-zinc-400 border'}`}>عملاء</button>
           <button onClick={() => setFilterType(PartyType.SUPPLIER)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filterType === PartyType.SUPPLIER ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 text-zinc-400 border'}`}>موردين</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
         {filteredParties.map(p => {
           const finalBalance = calculatePartyBalance(p);
           return (
             <div key={p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${p.type === PartyType.CUSTOMER ? 'bg-blue-600' : p.type === PartyType.SUPPLIER ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-4 rounded-2xl ${p.type === PartyType.CUSTOMER ? 'bg-blue-600/10 text-blue-600' : p.type === PartyType.SUPPLIER ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600'}`}><Users className="w-7 h-7" /></div>
                   <div className="flex gap-1">
                      <button onClick={() => { setEditingId(p.id); setFormData(p); setIsAdding(true); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-primary transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-500 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
                <div className="flex-1">
                   <h3 className="text-2xl font-black text-readable mb-1 leading-tight">{p.name}</h3>
                   <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase text-zinc-400">كود: {p.code}</span>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${p.type === PartyType.BOTH ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>{p.type}</span>
                   </div>
                   
                   <div className="space-y-1 opacity-70">
                      <div className="flex items-center gap-2 text-xs font-bold"><Phone className="w-3 h-3 text-primary" /> {p.phone || 'بدون هاتف'}</div>
                      <div className="flex items-center gap-2 text-xs font-bold"><MapPin className="w-3 h-3 text-primary" /> {p.address || 'بدون عنوان'}</div>
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">رصيد أول المدة</span>
                      <span className="font-mono font-black text-sm text-zinc-500">{p.openingBalance.toLocaleString()}</span>
                   </div>
                   
                   <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border dark:border-zinc-700">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-1"><Wallet className="w-3 h-3"/> الرصيد النهائي</span>
                         <span className="text-[8px] font-bold text-zinc-400">صافي المديونية / الدائنية</span>
                      </div>
                      <div className="text-left">
                         <span className={`font-mono font-black text-2xl ${finalBalance > 0 ? 'text-rose-600' : finalBalance < 0 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {finalBalance.toLocaleString()}
                         </span>
                         <span className="text-[9px] font-bold text-zinc-400 mr-1 uppercase">{settings?.currencySymbol}</span>
                      </div>
                   </div>
                </div>
             </div>
           );
         })}
      </div>

      {/* Print Table View */}
      <div className="print-only bg-white">
         <table className="w-full text-right border-collapse text-xs">
            <thead>
               <tr className="bg-zinc-900 text-white font-black h-12 uppercase tracking-widest">
                  <th className="p-3 border">كود</th>
                  <th className="p-3 border">الاسم</th>
                  <th className="p-3 border">النوع</th>
                  <th className="p-3 border">الهاتف</th>
                  <th className="p-3 border">الرصيد الافتتاحي</th>
                  <th className="p-3 border bg-zinc-100 text-black">الرصيد النهائي</th>
               </tr>
            </thead>
            <tbody className="font-bold">
               {filteredParties.map(p => (
                  <tr key={p.id} className="h-10 border-b">
                     <td className="p-3 border font-mono text-zinc-500">{p.code}</td>
                     <td className="p-3 border">{p.name}</td>
                     <td className="p-3 border text-center">{p.type}</td>
                     <td className="p-3 border font-mono text-center">{p.phone}</td>
                     <td className="p-3 border text-center font-mono">{p.openingBalance.toLocaleString()}</td>
                     <td className={`p-3 border text-center font-mono font-black ${calculatePartyBalance(p) > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {calculatePartyBalance(p).toLocaleString()}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default PartyManagementView;
