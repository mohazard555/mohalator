
import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, LayoutPanelLeft } from 'lucide-react';
import { StockEntry } from '../types';

interface ItemMovementViewProps {
  onBack: () => void;
}

interface ItemSummary {
  itemCode: string;
  itemName: string;
  unit: string;
  price: number;
  openingStock: number;
  warehouseType: string;
  added: number;
  issued: number;
  returned: number;
  usedBalance: number;
  currentBalance: number;
  total: number;
}

const ItemMovementView: React.FC<ItemMovementViewProps> = ({ onBack }) => {
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [items, setItems] = useState<ItemSummary[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('sheno_stock_entries');
    if (saved) {
      try {
        const entries: StockEntry[] = JSON.parse(saved);
        
        // Group entries by Item Code
        const grouped = entries.reduce((acc, entry) => {
          const key = entry.itemCode;
          if (!acc[key]) {
            acc[key] = {
              itemCode: entry.itemCode,
              itemName: entry.itemName,
              unit: entry.unit,
              price: entry.price || 0,
              openingStock: 0, 
              warehouseType: entry.warehouseType || 'مستودع',
              added: 0,
              issued: 0,
              returned: 0,
              usedBalance: 0,
              currentBalance: 0,
              total: 0
            };
          }
          
          if (entry.movementType === 'إدخال') acc[key].added += entry.quantity;
          else if (entry.movementType === 'صرف') {
            acc[key].issued += entry.quantity;
            acc[key].usedBalance += entry.quantity;
          }
          else if (entry.movementType === 'مرتجع') acc[key].returned += entry.quantity;
          
          acc[key].currentBalance = acc[key].openingStock + acc[key].added - acc[key].issued + acc[key].returned;
          return acc;
        }, {} as Record<string, ItemSummary>);

        setItems(Object.values(grouped));
      } catch (e) {
        console.error("Failed to load movement data");
      }
    }
  }, []);

  // Auto-populate item code when searching by name
  useEffect(() => {
    if (searchName.length > 1) {
      const match = items.find(item => item.itemName.includes(searchName));
      if (match) {
        setSearchCode(match.itemCode);
      }
    }
  }, [searchName, items]);

  const filteredItems = items.filter(item => {
    const matchesCode = !searchCode || item.itemCode.includes(searchCode);
    const matchesName = !searchName || item.itemName.includes(searchName);
    return matchesCode && matchesName;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-rose-900 border border-white/20 rounded-xl p-4 shadow-xl text-center relative">
        <h1 className="text-3xl font-bold text-white tracking-widest">تقرير حركة صنف</h1>
      </div>

      {/* Filter Section matching image style */}
      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-zinc-700 flex flex-wrap items-center gap-6 justify-center">
        <button 
          onClick={onBack}
          className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded shadow-lg flex items-center gap-2 hover:bg-zinc-700 border border-zinc-600"
        >
          <LayoutPanelLeft className="w-5 h-5" /> EXIT
        </button>

        <div className="flex items-center gap-2">
          <span className="text-rose-500 font-bold whitespace-nowrap">كود الصنف</span>
          <input 
            type="text" 
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="bg-transparent border-2 border-rose-900 rounded px-3 py-1 text-center w-24 outline-none font-mono text-white focus:border-rose-600"
          />
        </div>

        <div className="flex items-center gap-2 relative flex-1 max-w-md">
          <input 
            type="text" 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full bg-white text-zinc-900 border-2 border-rose-900 rounded px-3 py-1 pr-10 outline-none font-bold"
            placeholder="البحث باسم الصنف..."
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        </div>
      </div>

      {/* Main Table Content - Matches StockEntries Styling */}
      <div className="overflow-x-auto rounded-lg border border-zinc-700 shadow-2xl bg-zinc-800">
        <table className="w-full text-center border-collapse text-sm">
          <thead>
            <tr className="gradient-header text-white font-bold text-xs">
              <th className="p-3 border border-zinc-700">كود الصنف</th>
              <th className="p-3 border border-zinc-700">نوع الصنف</th>
              <th className="p-3 border border-zinc-700">الوحدة</th>
              <th className="p-3 border border-zinc-700">السعر</th>
              <th className="p-3 border border-zinc-700">رصيد أول المدة</th>
              <th className="p-3 border border-zinc-700">نوع المستودع</th>
              <th className="p-3 border border-zinc-700">الإضافة</th>
              <th className="p-3 border border-zinc-700">الصرف</th>
              <th className="p-3 border border-zinc-700">مرتجع</th>
              <th className="p-3 border border-zinc-700">رصيد المستخدم</th>
              <th className="p-3 border border-zinc-700 font-bold text-lg">الرصيد الحالي</th>
              <th className="p-3 border border-zinc-700">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700 text-[13px]">
            {filteredItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-700/50 transition-colors">
                <td className="p-3 border border-zinc-700 font-mono text-emerald-400 font-bold">{item.itemCode}</td>
                <td className="p-3 border border-zinc-700 font-semibold text-right pr-4">{item.itemName}</td>
                <td className="p-3 border border-zinc-700">{item.unit}</td>
                <td className="p-3 border border-zinc-700 font-mono">{item.price.toLocaleString()}</td>
                <td className="p-3 border border-zinc-700 font-mono">{item.openingStock.toFixed(3)}</td>
                <td className="p-3 border border-zinc-700">{item.warehouseType}</td>
                <td className="p-3 border border-zinc-700 font-mono text-emerald-400">+{item.added.toFixed(2)}</td>
                <td className="p-3 border border-zinc-700 font-mono text-rose-400">-{item.issued.toFixed(2)}</td>
                <td className="p-3 border border-zinc-700 font-mono text-amber-400">+{item.returned.toFixed(2)}</td>
                <td className="p-3 border border-zinc-700 font-mono bg-zinc-900/20">{item.usedBalance.toFixed(2)}</td>
                <td className="p-3 border border-zinc-700 font-mono text-lg font-bold bg-zinc-900/40">{item.currentBalance.toFixed(3)}</td>
                <td className="p-3 border border-zinc-700 font-mono text-zinc-400">{item.total.toFixed(2)}</td>
              </tr>
            ))}
            {/* Empty Rows Padding */}
            {Array.from({ length: Math.max(0, 8 - filteredItems.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="bg-zinc-800/30">
                {Array.from({ length: 12 }).map((__, j) => (
                  <td key={j} className="p-3 border border-zinc-700 h-10"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemMovementView;
