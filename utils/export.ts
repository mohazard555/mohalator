
import * as XLSX from 'xlsx';

/**
 * خدمة التصدير الاحترافية إلى ملفات Excel (XLSX)
 * تضمن هذه الوظيفة توزيع البيانات في أعمدة صحيحة ودعم كامل للعربية.
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.error("لا توجد بيانات للتصدير");
    return;
  }

  try {
    // 1. تنظيف وتجهيز البيانات
    const processedData = data.map(row => {
      const cleanRow: any = {};
      Object.keys(row).forEach(key => {
        let value = row[key];

        // معالجة المصفوفات (مثل قائمة الأصناف داخل الفاتورة)
        if (Array.isArray(value)) {
          value = value.map(item => {
            if (typeof item === 'object') {
              // استخراج اسم المادة والكمية إذا كان كائناً
              return `${item.name || item.itemName || ''} (${item.quantity || ''})`;
            }
            return String(item);
          }).join(' | ');
        } 
        // معالجة القيم الفارغة
        else if (value === null || value === undefined) {
          value = '';
        }
        
        cleanRow[key] = value;
      });
      return cleanRow;
    });

    // 2. إنشاء ورقة عمل (Worksheet) من البيانات
    const worksheet = XLSX.utils.json_to_sheet(processedData);

    // 3. ضبط اتجاه الصفحة للعربية (Right-to-Left)
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ RTL: true });

    // 4. إنشاء كتاب عمل (Workbook) وإضافة الورقة إليه
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // 5. توليد وحفظ الملف بتنسيق XLSX (وليس CSV لضمان التوافق)
    const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fullFilename);

  } catch (error) {
    console.error("خطأ أثناء تصدير ملف Excel:", error);
    alert("حدث خطأ أثناء محاولة تصدير البيانات. يرجى التأكد من توفر مكتبة التصدير.");
  }
};
