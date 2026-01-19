
import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, Plus, Trash2, Edit2, Save, X, Box, Clock, FileDown, User, Hash, HardDrive, ScrollText, Image as ImageIcon, CreditCard } from 'lucide-react';
import { SalesInvoice, InvoiceItem, StockEntry, Party, PartyType, InventoryItem, CashEntry, AppSettings } from '../types';
import { exportToCSV } from '../utils/export';

// وظيفة التفقيط الديناميكية بناءً على العملة
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
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
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

  const [manualItem, setManualItem] = useState({ 
    name: '', 
    quantity: 1, 
    price: 0, 
    serialNumber: '', 
    image: '' 
  });
  
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

  const handleAddManualItem = () => {
    if (!manualItem.name) return;
    const item: InvoiceItem = {
      id: crypto.randomUUID(),
      code: 'MANUAL',
      name: manualItem.name,
      quantity: manualItem.quantity,
      price: manualItem.price,
      unit: 'قطعة',
      total: manualItem.quantity * manualItem.price,
      date: newInvoice.date!,
      notes: '',
      image: manualItem.image,
      serialNumber: manualItem.serialNumber
    };
    setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), item] });
    setManualItem({ name: '', quantity: 1, price: 0, serialNumber: '', image: '' });
  };

  const handleAddUsedMaterial = () => {
    const mat = inventory.find(i => i.code === usedMaterial.code);
    if (!mat || usedMaterial.quantity <= 0) return;
    const item = { id: crypto.randomUUID(), code: mat.code, name: mat.name, quantity: usedMaterial.quantity, unit: mat.unit };
    setNewInvoice({ ...newInvoice, usedMaterials: [...(newInvoice.usedMaterials || []), item] });
    setUsedMaterial({ code: '', name: '', quantity: 1 });
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.customerName || (newInvoice.items || []).length === 0) {
      alert('يرجى اختيار العميل وإضافة بند واحد على الأقل للفاتورة');
      return;
    }
    
    const total = (newInvoice.items || []).reduce((sum, item) => sum + item.total, 0);
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const invNum = newInvoice.invoiceNumber || (invoices.length + 3000).toString();

    const invoice: SalesInvoice = {
      ...newInvoice as SalesInvoice,
      id: crypto.randomUUID(),
      invoiceNumber: invNum,
      time,
      totalAmount: total,
      totalAmountLiteral: tafqeet(total, settings?.currency || 'ليرة سورية')
    };

    const updated = [invoice, ...invoices];
    setInvoices(updated);
    localStorage.setItem('sheno_sales_invoices', JSON.stringify(updated));

    // Stock deduction with automated fields
    if (invoice.usedMaterials && invoice.usedMaterials.length > 0) {
      const savedStock = localStorage.getItem('sheno_stock_entries');
      let stock: StockEntry[] = savedStock ? JSON.parse(savedStock) : [];
      const deductions: StockEntry[] = (invoice.usedMaterials as any[]).map(m => ({
        id: crypto.randomUUID(),
        date: invoice.date,
        day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(invoice.date)),
        department: 'قسم المبيعات',
        itemCode: m.code,
        itemName: m.name,
        unit: m.unit || 'قطعة',
        price: 0,
        warehouse: 'المستودع الرئيسي',
        movementType: 'صرف',
        quantity: m.quantity,
        invoiceNumber: invNum,
        partyName: invoice.customerName,
        statement: `صرف مواد مستخدمة للفاتورة رقم ${invNum} - العميل: ${invoice.customerName}`
      }));
      localStorage.setItem('sheno_stock_entries', JSON.stringify([...deductions, ...stock]));
    }

    // Cash Journal
    if (invoice.paidAmount! > 0) {
      const savedCash = localStorage.getItem('sheno_cash_journal');
      let cashEntries: CashEntry[] = savedCash ? JSON.parse(savedCash) : [];
      const cashMove: CashEntry = {
        id: crypto.randomUUID(),
        date: invoice.date,
        statement: `مقبوضات فاتورة مبيعات ${invNum} (${invoice.paymentType}) - العميل: ${invoice.customerName}`,
        receivedSYP: invoice.paidAmount!,
        paidSYP: 0,
        receivedUSD: 0,
        paidUSD: 0,
        notes: invoice.notes,
        type: 'بيع'
      };
      localStorage.setItem('sheno_cash_journal', JSON.stringify([cashMove, ...cashEntries]));
    }

    setIsAdding(false);
    setNewInvoice({ invoiceNumber: '', customerName: '', date: new Date().toISOString().split('T')[0], items: [], usedMaterials: [], notes: '', paidAmount: 0, paymentType: 'نقداً' });
    alert('تم حفظ الفاتورة بنجاح وتحديث سجلات المستودع.');
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
          <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-8 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95">
            <Plus className="w-5 h-5" /> فاتورة مبيعات جديدة
          </button>
          <button onClick={() => exportToCSV(invoices, 'detailed_sales_report')} className="bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2">
             <FileDown className="w-5 h-5" /> تصدير XLSX
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8 animate-in zoom-in-95 no-print">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">العميل</label>
              <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.customerName} onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})}>
                <option value="">-- اختر زبون --</option>
                {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">رقم الفاتورة</label>
               <input type="text" placeholder="تلقائي" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">طريقة الدفع</label>
               <select className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={newInvoice.paymentType} onChange={e => setNewInvoice({...newInvoice, paymentType: e.target.value as any})}>
                  <option value="نقداً">نقداً (كاش)</option>
                  <option value="آجل">آجل (ذمم)</option>
               </select>
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">تاريخ العملية</label>
               <input type="date" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-bold" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
               <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mr-1">المبلغ المدفوع ({settings?.currencySymbol || 'ل.س'})</label>
               <input type="number" className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none font-black text-emerald-500" value={newInvoice.paidAmount} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h4 className="text-sm font-black text-primary flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 uppercase tracking-widest">
                   <ScrollText className="w-4 h-4" /> تفاصيل الأصناف (صورة وسيريال)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <input type="text" placeholder="اسم الصنف..." className="md:col-span-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                   <input type="text" placeholder="S/N: رقم تسلسلي" className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono text-xs outline-none" value={manualItem.serialNumber} onChange={e => setManualItem({...manualItem, serialNumber: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                   <div className="flex gap-2">
                      <input type="number" placeholder="الكمية" className="w-20 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: Number(e.target.value)})} />
                      <input type="number" placeholder="السعر" className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold text-emerald-600" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})} />
                   </div>
                   <div className="relative group cursor-pointer flex items-center justify-center border-2 border-dashed border-zinc-300 rounded-xl p-2 bg-white dark:bg-zinc-900 hover:border-primary transition-all">
                      {manualItem.image ? (
                        <img src={manualItem.image} className="h-10 w-auto object-contain rounded" />
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold"><ImageIcon className="w-4 h-4"/> صورة الصنف</div>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                   </div>
                   <button onClick={handleAddManualItem} className="bg-zinc-800 text-white p-3 rounded-xl shadow-lg hover:bg-zinc-700 transition-all font-bold flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> إضافة صنف
                   </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto mt-4">
                   <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 z-10 text-zinc-500 font-black">
                         <tr className="border-b">
                            <th className="p-2">الصورة</th>
                            <th className="p-2 text-right">الصنف (S/N)</th>
                            <th className="p-2 text-center">الكمية</th>
                            <th className="p-2 text-center">الإجمالي</th>
                            <th className="p-2"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 font-bold">
                         {newInvoice.items?.map(item => (
                            <tr key={item.id}>
                               <td className="p-2">
                                  {item.image && <img src={item.image} className="w-8 h-8 rounded object-cover shadow-sm" />}
                               </td>
                               <td className="p-2">
                                  <div className="flex flex-col">
                                     <span>{item.name}</span>
                                     <span className="text-[9px] text-zinc-400 font-mono">SN: {item.serialNumber || '-'}</span>
                                  </div>
                               </td>
                               <td className="p-2 text-center">{item.quantity}</td>
                               <td className="p-2 text-center text-primary">{item.total.toLocaleString()}</td>
                               <td className="p-2 text-center">
                                  <button onClick={() => setNewInvoice({...newInvoice, items: newInvoice.items?.filter(i => i.id !== item.id)})} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="bg-rose-500/5 dark:bg-rose-500/10 p-6 rounded-3xl border border-rose-500/20 space-y-4">
                <h4 className="text-sm font-black text-rose-600 flex items-center gap-2 border-b border-rose-500/20 pb-2 uppercase tracking-widest">
                   <HardDrive className="w-4 h-4" /> اختيار المواد المستهلكة (من المستودع)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <select className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none" value={usedMaterial.code} onChange={e => {
                      const mat = inventory.find(i => i.code === e.target.value);
                      setUsedMaterial({ ...usedMaterial, code: e.target.value, name: mat?.name || '' });
                   }}>
                      <option value="">-- اختر مادة من المستودع --</option>
                      {inventory.map(i => <option key={i.id} value={i.code}>{i.name} (رصيد: {i.currentBalance})</option>)}
                   </select>
                   <div className="flex gap-2">
                      <input type="number" placeholder="الكمية" className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center font-bold" value={usedMaterial.quantity} onChange={e => setUsedMaterial({...usedMaterial, quantity: Number(e.target.value)})} />
                      <button onClick={handleAddUsedMaterial} className="bg-rose-600 text-white p-3 rounded-xl shadow-lg hover:bg-rose-500 transition-all font-bold">إضافة مادة</button>
                   </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                   <table className="w-full text-xs">
                      <tbody className="divide-y divide-rose-100 dark:divide-rose-900/30 font-bold">
                         {(newInvoice.usedMaterials as any[])?.map(mat => (
                            <tr key={mat.id}>
                               <td className="p-2 font-mono text-zinc-500">{mat.code}</td>
                               <td className="p-2">{mat.name}</td>
                               <td className="p-2 text-center text-rose-600">{mat.quantity} {mat.unit}</td>
                               <td className="p-2 text-center">
                                  <button onClick={() => setNewInvoice({...newInvoice, usedMaterials: (newInvoice.usedMaterials as any[])?.filter(i => i.id !== mat.id)})} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded"><Trash2 className="w-4 h-4"/></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-800 gap-6">
             <div className="text-primary font-black text-xl bg-primary/5 px-8 py-3 rounded-2xl border border-primary/20 w-full md:w-auto text-center flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                <span>{tafqeet(newInvoice.items?.reduce((s,i) => s + i.total, 0) || 0, settings?.currency || 'ليرة سورية')}</span>
             </div>
             <div className="flex gap-3 w-full md:w-auto">
               <button onClick={handleSaveInvoice} className="flex-1 md:flex-none bg-primary text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2">
                 <Save className="w-5 h-5" /> حفظ الفاتورة وتحديث السجلات
               </button>
               <button onClick={() => setIsAdding(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-10 py-3 rounded-2xl font-bold">إلغاء</button>
             </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-[11px]">
            <thead>
              <tr className="bg-zinc-900 text-white font-black uppercase tracking-tighter border-b border-zinc-700">
                <th className="p-3 border-l border-zinc-800 text-center">تسلسل</th>
                <th className="p-3 border-l border-zinc-800 text-center">رقم</th>
                <th className="p-3 border-l border-zinc-800 text-center">تاريخ</th>
                <th className="p-3 border-l border-zinc-800 text-center">العميل</th>
                <th className="p-3 border-l border-zinc-800 text-right w-64">تفاصيل الأصناف</th>
                <th className="p-3 border-l border-zinc-800 text-right w-48">المواد المستخدمة</th>
                <th className="p-3 border-l border-zinc-800 text-center">العدد</th>
                <th className="p-3 border-l border-zinc-800 text-center">السعر الإفرادي</th>
                <th className="p-3 border-l border-zinc-800 text-center">الإجمالي</th>
                <th className="p-3 border-l border-zinc-800 text-right w-64">التفقيط (كتابة)</th>
                <th className="p-3 border-l border-zinc-800 text-right">ملاحظات</th>
                <th className="p-3 border-l border-zinc-800 text-center">وقت</th>
                <th className="p-3 border-l border-zinc-800 text-center no-print">تصدير</th>
                <th className="p-3 text-center">المدفوع ({settings?.currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-bold">
              {invoices.length === 0 ? (
                <tr><td colSpan={14} className="p-10 text-center italic text-zinc-400">لا يوجد سجلات مبيعات حتى الآن</td></tr>
              ) : (
                invoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">{invoices.length - idx}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center text-primary">#{inv.invoiceNumber}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-xs">{inv.date}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-readable">{inv.customerName}</td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto">
                        {inv.items.map((it, i) => (
                          <div key={i} className="flex items-center gap-1">
                             {it.image && <img src={it.image} className="w-5 h-5 rounded-sm object-cover" />}
                             <span className="truncate">{it.name} <span className="text-[8px] opacity-60 font-normal">({it.serialNumber})</span></span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                         {inv.usedMaterials?.map((m, i) => (
                           <span key={i} className="bg-rose-500/10 text-rose-600 px-1 py-0.5 rounded-sm text-[8px]">{m.name} ({m.quantity})</span>
                         ))}
                      </div>
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono">
                      {inv.items.reduce((s,i) => s + i.quantity, 0)}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-zinc-400">
                      {inv.items[0]?.price.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-black text-rose-600 font-mono">
                      {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-xs font-normal text-zinc-500 leading-tight">
                      {inv.totalAmountLiteral}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-zinc-400 font-normal italic">
                      {inv.notes || '-'}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center font-mono text-[9px] text-zinc-400">
                      {inv.time}
                    </td>
                    <td className="p-3 border-l border-zinc-100 dark:border-zinc-800 text-center no-print">
                      <button onClick={() => window.print()} className="p-1 text-zinc-300 hover:text-primary transition-all"><Printer className="w-4 h-4" /></button>
                    </td>
                    <td className="p-3 text-center text-emerald-600 font-mono">
                      {inv.paidAmount?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceView;
