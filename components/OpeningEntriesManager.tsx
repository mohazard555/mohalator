
import React from 'react';
import { Scale, Trash2 } from 'lucide-react';
import { OpeningEntry } from '../types';

interface OpeningEntriesManagerProps {
  openingEntries: OpeningEntry[];
  onDelete: (id: string) => void;
}

const OpeningEntriesManager: React.FC<OpeningEntriesManagerProps> = ({ openingEntries, onDelete }) => {
  return (
    <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in slide-in-from-bottom-4">
       <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-readable border-b dark:border-zinc-800 pb-4">
          <Scale className="w-8 h-8 text-primary"/> سجل القيود الافتتاحية للميزانية
       </h3>
       <div className="overflow-x-auto rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
          <table className="w-full text-right text-sm">
             <thead>
                <tr className="bg-zinc-900 text-white font-black h-14">
                   <th className="p-4 border-l border-zinc-800">التاريخ</th>
                   <th className="p-4 border-l border-zinc-800">اسم الحساب (الدليل/البنود)</th>
                   <th className="p-4 border-l border-zinc-800 text-center">التصنيف</th>
                   <th className="p-4 border-l border-zinc-800 text-center">مدين (+)</th>
                   <th className="p-4 border-l border-zinc-800 text-center">دائن (-)</th>
                   <th className="p-4">ملاحظات</th>
                   <th className="p-4 text-center">إجراء</th>
                </tr>
             </thead>
             <tbody className="divide-y font-bold">
                {openingEntries.map(e => (
                  <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                     <td className="p-4 font-mono text-zinc-400">{e.date}</td>
                     <td className="p-4 font-black">{e.accountName}</td>
                     <td className="p-4 text-center"><span className="text-[10px] px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-black border dark:border-zinc-700">{e.accountType}</span></td>
                     <td className="p-4 text-center font-mono text-emerald-600 text-lg">{e.debit.toLocaleString()}</td>
                     <td className="p-4 text-center font-mono text-rose-600 text-lg">{e.credit.toLocaleString()}</td>
                     <td className="p-4 text-zinc-400 font-normal italic">{e.notes}</td>
                     <td className="p-4 text-center">
                        <button onClick={() => onDelete(e.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                     </td>
                  </tr>
                ))}
                {openingEntries.length === 0 && (
                   <tr><td colSpan={7} className="p-20 text-center italic text-zinc-300">لا يوجد قيود افتتاحية مسجلة</td></tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default OpeningEntriesManager;
