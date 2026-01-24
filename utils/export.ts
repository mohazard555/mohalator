
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  // استخراج العناوين
  const headers = Object.keys(data[0]);
  
  // تجهيز الأسطر مع تغليف القيم لضمان سلامة الفواصل
  const csvRows = [
    'sep=,', // توجيه لـ Excel لاستخدام الفاصلة كمعيار للأعمدة
    headers.join(','), // سطر العناوين
    ...data.map(row => headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // تحويل الكائنات والمصفوفات لنصوص مقروءة
      if (Array.isArray(cell)) {
        cell = cell.map(item => item.name || item.itemName || JSON.stringify(item)).join(' | ');
      } else if (typeof cell === 'object') {
        cell = JSON.stringify(cell);
      }

      // تنظيف القيم وتغليفها
      return `"${String(cell).replace(/"/g, '""')}"`;
    }).join(','))
  ];

  const csvContent = csvRows.join('\r\n'); // استخدام فاصل الأسطر الخاص بويندوز لضمان التوافق

  // استخدام BOM (Byte Order Mark) لترميز UTF-8 لضمان قراءة اللغة العربية فوراً في Excel
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};