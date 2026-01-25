
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  // استخراج العناوين
  const headers = Object.keys(data[0]);
  
  // تجهيز الأسطر
  const csvRows = [
    headers.join(','), // سطر العناوين
    ...data.map(row => headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      
      // تحويل المصفوفات أو الكائنات لنصوص
      if (Array.isArray(cell)) {
        cell = cell.map(item => item.name || item.itemName || JSON.stringify(item)).join(' | ');
      } else if (typeof cell === 'object') {
        cell = JSON.stringify(cell);
      }

      // تنظيف القيم وتغليفها لضمان عدم تداخل الفواصل
      const cellStr = String(cell).replace(/"/g, '""');
      return `"${cellStr}"`;
    }).join(','))
  ];

  const csvContent = csvRows.join('\r\n');

  // إضافة BOM لترميز UTF-8 لضمان قراءة Excel للغة العربية فوراً
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
