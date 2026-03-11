import React from 'react';
import { AppSettings } from '../types';

interface PrintHeaderProps {
  settings: AppSettings | null;
  title: string;
  period?: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ settings, title, period }) => {
  return (
    <div className="hidden print:flex flex-col w-full mb-6">
      <div className="flex justify-between items-center w-full mb-4">
        {/* Right side (first in RTL) - Date and Country */}
        <div className="text-right">
          <p className="text-sm font-bold text-zinc-600">{settings?.address || 'سوريا'}</p>
          <p className="text-sm font-bold text-zinc-600 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        
        {/* Center - Title */}
        <div className="text-center flex-1">
          <h2 className="text-3xl font-black text-black">{title}</h2>
          {period && <p className="text-sm font-bold text-rose-600 mt-2">{period}</p>}
        </div>
        
        {/* Left side (last in RTL) - Logo and Company */}
        <div className="text-left flex items-center justify-end gap-3">
          <div className="text-right">
            <h1 className="text-xl font-black text-rose-700 uppercase tracking-wider">{settings?.companyName || 'SAMLATOR2026'}</h1>
            <p className="text-[10px] text-zinc-500 font-bold mt-1">{settings?.companyType || 'نظام إدارة محاسبية مطور'}</p>
          </div>
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} className="w-12 h-12 object-contain" alt="Logo" />
          ) : (
            <div className="w-12 h-12 text-primary font-black text-2xl flex items-center justify-center">SH</div>
          )}
        </div>
      </div>
      
      {/* Thick Red Line */}
      <div className="w-full h-1.5 bg-rose-700 rounded-full"></div>
    </div>
  );
};

