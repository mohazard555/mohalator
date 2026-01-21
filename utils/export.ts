
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  // استخراج العناوين
  const headers = Object.keys(data[0]);
  
  // تجهيز الأسطر
  const csvRows = [
    'sep=,', // تعليمة خاصة لـ Excel لفتح الملف في أعمدة مباشرة بالاعتماد على الفاصلة
    headers.join(','), // سطر العناوين
    ...data.map(row => headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // إذا كانت الخلية تحتوي على مصفوفة (مثل قائمة الأصناف) نقوم بتحويلها لنص مقروء بدلاً من [object Object]
      if (Array.isArray(cell)) {
        cell = cell.map(item => item.name || item.itemName || JSON.stringify(item)).join(' | ');
      } else if (typeof cell === 'object') {
        cell = JSON.stringify(cell);
      }

      // تنظيف النص وتغليفه بعلامات تنصيص للتعامل مع الفواصل داخل النص نفسه
      return `"${String(cell).replace(/"/g, '""')}"`;
    }).join(','))
  ];

  const csvContent = csvRows.join('\n');

  // إضافة BOM (Byte Order Mark) لضمان دعم اللغة العربية بشكل صحيح عند الفتح في Excel
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
