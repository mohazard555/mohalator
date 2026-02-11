
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Search, FileOutput, X, Users, Box, HardDrive, Calendar, Eye, EyeOff, FileDown, ImageIcon, Calculator, FileStack, Truck } from 'lucide-react';
import { PurchaseInvoice, InvoiceItem, CashEntry, Party, PartyType, AppSettings } from '../types';
import { tafqeet } from '../utils/tafqeet';
import { ImageExportService } from '../utils/ImageExportService';

declare var html2pdf: any;

interface DetailedSupplierReportViewProps {
  onBack: () => void;
}

const DetailedSupplierReportView: React.FC<DetailedSupplierReportViewProps> = ({ onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  
  const [showItems, setShowItems] = useState(true);

  useEffect(() => {
    const savedPurchases = localStorage.getItem('sheno_purchases');
    const savedReturns = localStorage.getItem('sheno_purchase_returns');
    const savedCash = localStorage.getItem('sheno_cash_journal');
    const savedParties = localStorage.getItem('sheno_parties');
    const savedSettings = localStorage.getItem('sheno_settings');
    
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
    if (savedReturns) setPurchaseReturns(JSON.parse(savedReturns));
    if (savedCash) setCashEntries(JSON.parse(savedCash));
    if (savedParties) setParties(JSON.parse(savedParties).filter((p: Party) => p.type === PartyType.SUPPLIER || p.type === PartyType.BOTH));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const getSupplierMovements = () => {
    const movements: any[] = [];
    
    // 1. فواتير المشتريات (تزيد مديونية المورد)
    purchases.filter(p => {
      const matchName = p.supplierName === supplierFilter;
      const matchDate = (!startDate || p.date >= startDate) && (!endDate || p.date <= endDate);
      return matchName && matchDate;
    }).forEach(inv => {
      const itemsGross = inv.items.reduce((s, i) => s + i.total, 0) + (inv.transportExpenses || 0);

      movements.push({
        date: inv.date,
        type: 'شراء',
        number: inv.invoiceNumber,
        statement: `فاتورة شراء رقم ${inv.invoiceNumber}`,
        items: inv.items,
        purchases: itemsGross, // القيمة الإجمالية قبل الحسم
        returns: 0,
        paid: 0,
        discount: 0,
        ref: inv.id
      });

      // 2. الحسم المكتسب من الفاتورة كبند تسوية مستقل (يقلل المديونية)
      if (inv.discountAmount && inv.discountAmount > 0) {
        movements.push({
          date: inv.date,
          type: 'حسم',
          number: inv.invoiceNumber,
          statement: `حسم مكتسب من فاتورة رقم ${inv.invoiceNumber}`,
          items: [],
          purchases: 0,
          returns: 0,
          paid: 0,
          discount: inv.discountAmount,
          ref: inv.id
        });
      }
    });

    // 3. مرتجع مشتريات (يقلل مديونية المورد)
    purchaseReturns.filter(r => {
      const matchName = r.supplierName === supplierFilter;
      const matchDate = (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
      return matchName && matchDate;
    }).forEach(ret => {
      movements.push({
        date: ret.date,
        type: 'مرتجع',
        number: ret.invoiceNumber,
        statement: `مرتجع مشتريات للفاتورة رقم ${ret.invoiceNumber}`,
        items: ret.items,
        purchases: 0,
        returns: ret.totalReturnAmount,
        paid: 0,
        discount: 0,
        ref: ret.id
      });
    });

    // 4. سندات الصرف / الدفعات النقدية الفعلية (تقلل مديونية المورد)
    cashEntries.filter(e => {
      const matchName = e.partyName === supplierFilter || e.statement.includes(supplierFilter);
      const matchType = e.type === 'دفع' || e.type === 'شراء';
      const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      return matchName && matchType && matchDate;
    }).forEach(entry => {
      movements.push({
        date: entry.date,
        type: 'دفع',
        number: entry.voucherNumber || '---',
        statement: entry.statement,
        items: [],
        purchases: 0,
        returns: 0,
        paid: (entry.paidSYP || 0) + (entry.paidUSD || 0),
        discount: 0,
        ref: entry.id
      });
    });

    return movements.sort((a, b) => a.date.localeCompare(b.date));
  };

  const reportMovements = supplierFilter ? getSupplierMovements() : [];

  const totals = reportMovements.reduce((acc, curr) => {
    acc.purchases += curr.purchases;
    acc.returns += curr.returns;
    acc.paid += curr.paid;
    acc.discount += curr.discount;
    return acc;
  }, { purchases: 0, returns: 0, paid: 0, discount: 0 });

  const openingBalance = supplierFilter ? (parties.find(p => p.name === supplierFilter)?.openingBalance || 0) : 0;
  
  // الرصيد = (الافتتاحي + المشتريات) - (المرتجع + المدفوع + الحسم المكتسب)
  const finalBalance = openingBalance + totals.purchases - (totals.returns + totals.paid + totals.discount);

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `كشف_حساب_مورد_${supplierFilter || 'عام'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-4 text-right bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 rounded-3xl shadow-2xl min-h-screen text-readable border border-zinc-200 dark:border-zinc-800 print:bg-white print:border-none print:shadow-none" dir="rtl">
      
      <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-zinc-200 dark:border-zinc-800 pb-4 mb-4 no-print gap-4">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all">
               <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
               <div className="bg-amber-600 p-2 rounded shadow-sm border border-zinc-300 w-10 h-10 flex items-center justify-center text-white font-black">
                  <Truck className="w-6 h-6" />
               </div>
               <div className="flex flex-col">
                 <span className="text-readable font-black text-lg leading-none">كشف حساب مورد تفصيلي</span>
                 <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest">SUPPLIER LEDGER STATEMENT</span>
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => ImageExportService.exportAsPng(reportRef.current!, 'Supplier_Report')}
              disabled={isExportingImage}
              className="bg-zinc-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg hover:bg-zinc-700 transition-all"
            >
               {isExportingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon className="w-5 h-5" />} حفظ كصورة
            </button>
            <button onClick={() => window.print()} className="bg-amber-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg hover:brightness-110 transition-all">
               <Printer className="w-5 h-5" /> طباعة
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl no-print">
         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">عدد الأصناف الموردة</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">
                 {reportMovements.reduce((s, m) => s + (m.items?.length || 0), 0)}
               </div>
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 flex-1 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">إجمالي عدد الفواتير</div>
               <div className="flex-1 p-2 text-center font-black text-2xl flex items-center justify-center text-readable">
                 {reportMovements.filter(m => m.type === 'شراء').length}
               </div>
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex border-b-2 border-zinc-200 dark:border-zinc-800 flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-32 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">من تاريخ</div>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-sm bg-transparent text-readable" />
            </div>
            <div className="flex flex-1">
               <div className="bg-zinc-100 dark:bg-zinc-800 w-32 p-2 text-xs font-bold text-center border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center">إلى تاريخ</div>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 text-center font-mono outline-none text-sm bg-transparent text-readable" />
            </div>
         </div>

         <div className="col-span-1 border-l-2 border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-800/50">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 text-xs font-bold text-center border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-readable">
               <Users className="w-3 h-3 text-amber-600"/> اختيار المورد
            </div>
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="flex-1 text-center font-black text-xl outline-none py-4 appearance-none cursor-pointer bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-400">
              <option value="">-- عرض جميع الموردين --</option>
              {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
         </div>

         <div className="col-span-1 flex flex-col items-center justify-center p-4 gap-3 bg-zinc-100/50 dark:bg-zinc-800/30">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">إعدادات العرض</span>
            <button onClick={() => setShowItems(!showItems)} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs transition-all w-full justify-center ${showItems ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-600 text-white shadow-lg'}`}>
               {showItems ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               {showItems ? 'إخفاء عمود المواد' : 'إظهار عمود المواد'}
            </button>
         </div>
      </div>

      <div ref={reportRef} className="bg-white border-2 border-amber-800 shadow-xl rounded-2xl overflow-hidden p-4 md:p-8 export-fix">
        
        <div className="flex justify-between items-center border-b-4 border-amber-800 pb-6 mb-8 bg-white text-zinc-900">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && <img src={settings.logoUrl} className="w-20 h-20 object-contain bg-white" />}
            <div>
              <h1 className="text-3xl font-black text-amber-900 leading-none">{settings?.companyName}</h1>
              <p className="text-[10px] text-zinc-500 font-black uppercase mt-1">كشف حساب مورد مالي</p>
              <p className="text-[10px] text-zinc-400 font-bold" dir="ltr">{settings?.phone}</p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-black underline decoration-amber-900/20 underline-offset-8">كشف حساب المورد التفصيلي</h2>
            <div className="text-lg font-black text-amber-800 mt-4">{supplierFilter || 'كافة الموردين'}</div>
            <div className="flex items-center justify-center gap-3 mt-2 text-zinc-400 text-[9px] font-bold">
               <span className="font-mono bg-zinc-50 px-2 py-0.5 rounded border">{startDate || 'الأول'}</span>
               <span className="text-amber-300">←</span>
               <span className="font-mono bg-zinc-50 px-2 py-0.5 rounded border">{endDate || 'الآن'}</span>
            </div>
          </div>

          <div className="text-left text-xs font-bold text-zinc-400">
            <p>{settings?.address}</p>
            <p className="mt-2 text-[9px] font-black uppercase">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        <table className="w-full text-right border-collapse text-[10px]">
          <thead>
            <tr className="bg-zinc-100 text-zinc-900 font-black border-y-2 border-amber-800 h-10">
              <th className="p-1 border border-zinc-200 w-24 text-center">التاريخ</th>
              <th className="p-1 border border-zinc-200 w-12 text-center">نوع السند</th>
              <th className="p-1 border border-zinc-200 text-right pr-4">البيان الرسمي للعملية</th>
              {showItems && <th className="p-1 border border-zinc-200 text-right pr-4">المواد الواردة/المعادة</th>}
              <th className="p-1 border border-zinc-200 w-24 text-center text-rose-700 bg-rose-50">قيمة المشتريات (+)</th>
              <th className="p-1 border border-zinc-200 w-24 text-center text-emerald-700 bg-emerald-50">المدفوع للمورد (-)</th>
            </tr>
          </thead>
          <tbody className="text-zinc-800">
            {supplierFilter && openingBalance !== 0 && (
              <tr className="h-10 bg-zinc-50/50 font-black border-b italic">
                <td className="p-1 border text-center text-zinc-400">{startDate || '---'}</td>
                <td className="p-1 border text-center">قيد</td>
                <td className="p-1 border pr-4">رصيد افتتاحي (أول المدة)</td>
                {showItems && <td className="p-1 border text-center text-zinc-300">---</td>}
                <td className="p-1 border text-center text-rose-700">{openingBalance > 0 ? openingBalance.toLocaleString() : '0'}</td>
                <td className="p-1 border text-center text-emerald-700">{openingBalance < 0 ? Math.abs(openingBalance).toLocaleString() : '0'}</td>
              </tr>
            )}

            {reportMovements.length === 0 ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="h-8 border-b border-zinc-100">
                  {Array.from({ length: showItems ? 6 : 5 }).map((__, j) => <td key={j} className="border border-zinc-100"></td>)}
                </tr>
              ))
            ) : (
              reportMovements.map((move, idx) => (
                <tr key={idx} className="h-10 border-b border-zinc-100 font-bold hover:bg-amber-50/20 transition-colors">
                  <td className="p-1 border-zinc-200 font-mono text-center text-zinc-400">{move.date}</td>
                  <td className="p-1 border-zinc-200 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                      move.type === 'شراء' ? 'bg-rose-100 text-rose-800' : 
                      move.type === 'مرتجع' ? 'bg-amber-100 text-amber-800' : 
                      move.type === 'حسم' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {move.type}
                    </span>
                  </td>
                  <td className="p-1 border-zinc-200 pr-4 text-zinc-900">{move.statement}</td>
                  {showItems && (
                    <td className="p-1 border-zinc-200 pr-4 bg-zinc-50/20">
                       <div className="flex flex-wrap gap-1">
                          {move.items.map((it: any, i: number) => (
                            <span key={i} className="bg-white text-zinc-500 px-1.5 py-0.5 rounded-sm border text-[8px]">
                               {it.name} ({it.quantity})
                            </span>
                          ))}
                       </div>
                    </td>
                  )}
                  <td className="p-1 border-zinc-200 font-mono text-center text-rose-800">
                    {move.purchases > 0 ? move.purchases.toLocaleString() : ''}
                  </td>
                  <td className="p-1 border-zinc-200 font-mono text-center text-emerald-800">
                    { (move.paid + move.returns + move.discount) > 0 ? (move.paid + move.returns + move.discount).toLocaleString() : '' }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
           <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">إجمالي المشتريات</span>
              <span className="text-2xl font-mono font-black text-rose-800">{totals.purchases.toLocaleString()}</span>
           </div>
           <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">إجمالي المرتجعات</span>
              <span className="text-2xl font-mono font-black text-amber-700">{totals.returns.toLocaleString()}</span>
           </div>
           <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">الحسم المكتسب</span>
              <span className="text-2xl font-mono font-black text-blue-700">{totals.discount.toLocaleString()}</span>
           </div>
           <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center shadow-md">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">إجمالي المدفوع نقداً</span>
              <span className="text-2xl font-mono font-black text-emerald-800">{totals.paid.toLocaleString()}</span>
           </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-6">
           <div className="flex-1 bg-zinc-900 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[100px] rounded-full"></div>
              <div className="relative z-10">
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 block">FINAL ACCOUNT BALANCE</span>
                 <h3 className="text-xl font-black italic">صافي مديونية المورد المستحقة حالياً:</h3>
              </div>
              <div className="text-center relative z-10">
                 <div className="text-5xl font-black font-mono tracking-tighter text-amber-400">
                    {finalBalance.toLocaleString()}
                 </div>
                 <span className="text-sm font-bold text-zinc-500 uppercase mt-2 block tracking-widest">{settings?.currency}</span>
              </div>
           </div>

           <div className="w-full md:w-96 bg-white border-2 border-zinc-200 p-6 rounded-[2rem] flex flex-col justify-center space-y-3">
              <span className="text-[10px] font-black text-zinc-400 uppercase border-b pb-1">المبلغ كتابةً / التفقيط</span>
              <div className="text-xs font-black italic text-zinc-700 leading-relaxed">
                 {tafqeet(finalBalance, settings?.currency || 'ليرة سورية')}
              </div>
           </div>
        </div>

        <div className="mt-12 flex justify-between items-end border-t pt-8 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
           <div className="flex flex-col gap-1">
              <span>SAMLATOR INTELLIGENCE PLATFORM | SECURED TERMINAL</span>
              <span>تاريخ استخراج التقرير: {new Date().toLocaleString('ar-SA')}</span>
           </div>
           <div className="text-center">
              <div className="w-48 border-b-2 border-zinc-200 mb-2"></div>
              <span>توقيع المدير المالي / الختم الرسمي</span>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center no-print pt-6 pb-20">
         <button onClick={onBack} className="bg-zinc-100 dark:bg-zinc-800 text-readable px-8 py-3 rounded-2xl font-bold shadow-sm hover:bg-zinc-200 transition-all flex items-center gap-2 border border-zinc-200">
            العودة للرئيسية
         </button>
         <button onClick={handleExportPDF} className="bg-rose-900 text-white px-12 py-3 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
            <FileDown className="w-6 h-6" /> تصدير نسخة PDF
         </button>
      </div>
    </div>
  );
};

export default DetailedSupplierReportView;
