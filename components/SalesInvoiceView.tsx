
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, Box, Clock, FileDown, User, Hash, HardDrive, ScrollText, Image as ImageIcon, CreditCard, Coins, Upload } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, Party, PartyType, InventoryItem, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

const tafqeet = (n: number, currencyName: string): string => {
  if (n === 0) return "صفر";
  return `${n.toLocaleString()} ${currencyName} فقط لا غير`;
};

interface SalesInvoiceViewProps {
  onBack: () => void;
}

const SalesInvoiceView: React.FC<SalesInvoiceViewProps> = ({ onBack }) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<'primary' | 'secondary'>('primary');

  const [newInvoice, setNewInvoice] = useState<Partial<SalesInvoice>>({
    invoiceNumber: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    usedMaterials: [],
    notes: '',
    paidAmount: 0,
    paymentType: 'نقداً'
  });

  const [manualItem, setManualItem] = useState({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
  const [usedMaterial, setUsedMaterial] = useState({ code: '', name: '', quantity: 1 });

  useEffect(() => {
    const savedInv = localStorage.getItem('sheno_sales_invoices');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedInventory = localStorage.getItem('sheno_inventory_list');
    const savedSettings = localStorage.getItem('sheno_settings');

    if (savedInv) setInvoices(JSON.parse(savedInv));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.CUSTOMER));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualItem(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.customerName || (newInvoice.items || []).length === 0) {
      alert('يرجى اختيار العميل وإضافة بند واحد على الأقل');
      return;
    }
    const total = (newInvoice.items || []).reduce((sum, item) => sum + item.total, 0);
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const invNum = newInvoice.invoiceNumber || (invoices.length + 3000).toString();
    const currencyName = selectedCurrencyType === 'primary' ? (settings?.currency || 'ليرة سورية') : (settings?.secondaryCurrency || 'دولار');
    const currencySymbol = selectedCurrencyType === 'primary' ? (settings?.currencySymbol || 'ل.س') : (settings?.secondaryCurrencySymbol || '$');

    const invoice: SalesInvoice = {
      ...newInvoice as SalesInvoice,
      id: editingId || crypto.randomUUID(),
      invoiceNumber: invNum,
      time,
      totalAmount: total,
      currencySymbol: currencySymbol,
      totalAmountLiteral: tafqeet(total, currencyName)
    };

    const updated = editingId ? invoices.map(i => i.id === editingId ? invoice : i) : [invoice, ...invoices];
    setInvoices(updated);
    localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('حذف الفاتورة؟')) {
      const updated = invoices.filter(i => i.id !== id);
      setInvoices(updated);
      localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-readable">فواتير المبيعات المتطورة</h2>
        </div>
        <div className="flex gap-2">
          {!isAdding && (
            <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:brightness-110">
              <Plus className="w-5 h-5" /> فاتورة مبيعات جديدة
            </button>
          )}
          <button onClick={() => exportToCSV(invoices, 'sales_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95 no-print text-readable">
          {/* Header Info - Updated with Currency Selector */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-readable font-black uppercase tracking-widest mr-1">العميل</label>
              <select className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none text-readable" value={newInvoice.customerName} onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})}>
                <option value="">-- اختر زبون --</option>
                {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-muted-readable font-black uppercase tracking-widest mr-1">رقم الفاتورة</label>
               <input type="text" className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} placeholder="تلقائي" />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-muted-readable font-black uppercase tracking-widest mr-1">العملة</label>
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-[52px]">
                  <button onClick={() => setSelectedCurrencyType('primary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'primary' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.currencySymbol || '1'}</button>
                  <button onClick={() => setSelectedCurrencyType('secondary')} className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${selectedCurrencyType === 'secondary' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>{settings?.secondaryCurrencySymbol || '2'}</button>
               </div>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-muted-readable font-black uppercase tracking-widest mr-1">تاريخ العملية</label>
               <input type="date" className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold text-readable" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-muted-readable font-black uppercase tracking-widest mr-1">المبلغ المدفوع</label>
               <input type="number" className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-black text-emerald-500 text-xl" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* الأصناف المباعة */}
             <div className="bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-inner">
                <h4 className="text-sm font-black text-primary flex items-center justify-end gap-2 pb-2 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                   الأصناف المباعة <ScrollText className="w-5 h-5" />
                </h4>
                <div className="flex items-center gap-2">
                   <button onClick={() => {
                      if(!manualItem.name) return;
                      const item: InvoiceItem = { id: crypto.randomUUID(), code: 'ITEM', name: manualItem.name, quantity: manualItem.quantity, price: manualItem.price, unit: 'قطعة', total: manualItem.quantity * manualItem.price, date: newInvoice.date!, notes: '', image: manualItem.image };
                      setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
                      setManualItem({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
                   }} className="bg-zinc-800 dark:bg-zinc-900 text-zinc-400 p-3 rounded-xl border border-zinc-700 hover:text-white transition-all">
                      <Plus className="w-6 h-6"/>
                   </button>
                   <input type="number" placeholder="0" className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-emerald-500 outline-none" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: Number(e.target.value)})} />
                   <input type="number" placeholder="السعر" className="w-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-amber-500 outline-none" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})} />
                   <div className="relative w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-all overflow-hidden shrink-0">
                      {manualItem.image ? (
                        <>
                          <img src={manualItem.image} className="w-full h-full object-cover" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setManualItem(prev => ({ ...prev, image: '' })); }}
                            className="absolute top-0 right-0 bg-rose-600 text-white p-0.5 rounded-bl shadow-lg hover:bg-rose-500 z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 text-zinc-600" />
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                        </>
                      )}
                   </div>
                   <input type="text" placeholder="اسم الصنف..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-right font-black text-white outline-none focus:border-zinc-600" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                </div>
             </div>

             {/* المواد المستخدمة */}
             <div className="bg-rose-500/5 dark:bg-rose-950/20 p-5 rounded-[2rem] border border-rose-500/20 space-y-4 shadow-inner">
                <h4 className="text-sm font-black text-rose-500 flex items-center justify-end gap-2 pb-2 uppercase tracking-widest border-b border-rose-500/10">
                   المواد المستخدمة (خصم مخزني) <HardDrive className="w-5 h-5" />
                </h4>
                <div className="flex items-center gap-2">
                   <button onClick={() => {
                      const mat = inventory.find(i => i.code === usedMaterial.code);
                      if (!mat) return;
                      const item = { id: crypto.randomUUID(), code: mat.code, name: mat.name, quantity: usedMaterial.quantity, unit: mat.unit };
                      setNewInvoice({ ...newInvoice, usedMaterials: [...(newInvoice.usedMaterials || []), item] });
                      setUsedMaterial({ code: '', name: '', quantity: 1 });
                   }} className="bg-primary text-white px-6 py-3 rounded-xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all">خصم</button>
                   <input type="number" placeholder="الكمية" className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center font-black text-rose-500 outline-none" value={usedMaterial.quantity} onChange={e => setUsedMaterial({...usedMaterial, quantity: Number(e.target.value)})} />
                   <select className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-right font-black text-white outline-none appearance-none" value={usedMaterial.code} onChange={e => {
                      const mat = inventory.find(i => i.code === e.target.value);
                      setUsedMaterial({ ...usedMaterial, code: e.target.value, name: mat?.name || '' });
                   }}>
                      <option value="">-- اختر مادة مخزنية --</option>
                      {inventory.map(i => <option key={i.id} value={i.code}>{i.name} (رصيد: {i.currentBalance})</option>)}
                   </select>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
             <button onClick={handleSaveInvoice} className="bg-primary text-white px-16 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all text-lg">تثبيت وحفظ الفاتورة</button>
             <button onClick={() => setIsAdding(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-4 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[10px]">
            <thead>
              <tr className="bg-zinc-900 text-always-white font-black border-b border-zinc-700 h-14 uppercase tracking-tighter">
                <th className="p-2 border-l border-zinc-800 text-center w-12 text-always-white">تسلسل</th>
                <th className="p-2 border-l border-zinc-800 text-center w-16 text-always-white">رقم</th>
                <th className="p-2 border-l border-zinc-800 text-center w-20 text-always-white">تاريخ</th>
                <th className="p-2 border-l border-zinc-800 text-center text-always-white">العميل</th>
                <th className="p-2 border-l border-zinc-800 text-right w-48 text-always-white">تفاصيل الأصناف</th>
                <th className="p-2 border-l border-zinc-800 text-right w-40 text-always-white">المواد المستخدمة</th>
                <th className="p-2 border-l border-zinc-800 text-center w-12 text-always-white">العدد</th>
                <th className="p-2 border-l border-zinc-800 text-center w-20 text-always-white">السعر الإفرادي</th>
                <th className="p-2 border-l border-zinc-800 text-center w-24 text-always-white">الإجمالي</th>
                <th className="p-2 border-l border-zinc-800 text-right w-48 text-always-white">التفقيط (كتابة)</th>
                <th className="p-2 border-l border-zinc-800 text-right text-always-white">ملاحظات</th>
                <th className="p-2 border-l border-zinc-800 text-center w-16 text-always-white">وقت</th>
                <th className="p-2 border-l border-zinc-800 text-center w-20 no-print text-always-white">إجراءات</th>
                <th className="p-2 text-center w-20 text-always-white">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {invoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors h-12">
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-muted-readable">{invoices.length - idx}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center text-primary font-black">#{inv.invoiceNumber}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[9px] text-readable">{inv.date}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-readable truncate max-w-[100px]">{inv.customerName}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-readable">
                    <div className="flex flex-col gap-0.5 max-h-12 overflow-y-auto font-bold">
                      {inv.items.map((it, i) => ( 
                        <div key={i} className="flex items-center gap-1 truncate">
                          {it.image && <img src={it.image} className="w-4 h-4 rounded-sm object-cover" />}
                          • {it.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                       {inv.usedMaterials?.map((m, i) => ( <span key={i} className="bg-rose-500/10 text-rose-600 px-1 py-0.5 rounded-sm text-[8px] font-black">{m.name}</span> ))}
                    </div>
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-readable">{inv.items.reduce((s,i) => s + i.quantity, 0)}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-muted-readable">{inv.items[0]?.price.toLocaleString()}</td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono text-sm bg-rose-50/20 dark:bg-rose-900/10">
                    {inv.totalAmount.toLocaleString()}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-[8px] font-bold text-muted-readable leading-tight">
                    {inv.totalAmountLiteral}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-muted-readable font-normal italic truncate max-w-[100px]">
                    {inv.notes || '-'}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[8px] text-muted-readable">
                    {inv.time}
                  </td>
                  <td className="p-2 border-l border-zinc-100 dark:border-zinc-800 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => window.print()} className="p-1 text-zinc-400 hover:text-primary transition-all"><Printer className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1 text-zinc-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                  <td className="p-2 text-center text-emerald-600 font-mono text-xs font-black">
                    {inv.paidAmount?.toLocaleString() || '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceView;
