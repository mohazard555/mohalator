
import { AccountNode } from '../types';

export const DEFAULT_CHART_ROOTS: AccountNode[] = [
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

export const getPrefix = () => {
  const activeId = localStorage.getItem('sheno_active_company_id') || 'default';
  return activeId === 'default' ? 'sheno' : `sheno_${activeId}`;
};

export const loadChartAccounts = (): AccountNode[] => {
  const prefix = getPrefix();
  const saved = localStorage.getItem(`${prefix}_chart_accounts`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse chart accounts', e);
      return DEFAULT_CHART_ROOTS;
    }
  }
  return DEFAULT_CHART_ROOTS;
};

export const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
    .toLowerCase();
};
