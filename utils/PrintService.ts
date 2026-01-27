
/**
 * PrintService
 * مسؤول عن تجهيز الصفحة للطباعة بالوضع المختار (ملون أو أبيض وأسود)
 */

export const PrintService = {
  /**
   * تنفيذ عملية الطباعة مع وضع محدد
   * @param mode 'bw' (أبيض وأسود) أو 'color' (ملون)
   */
  print: (mode: 'bw' | 'color' = 'bw') => {
    const body = document.body;
    
    // إزالة أي أوضاع سابقة
    body.classList.remove('print-mode-bw', 'print-mode-color');
    
    // إضافة الوضع المختار
    const className = mode === 'bw' ? 'print-mode-bw' : 'print-mode-color';
    body.classList.add(className);
    
    // استدعاء نافذة الطباعة
    window.print();
    
    // تنظيف الفئات بعد إغلاق نافذة الطباعة (اختياري، لضمان عدم تأثر المعاينة اللاحقة)
    // نستخدم setTimeout لأن window.print() يوقف التنفيذ في بعض المتصفحات
    setTimeout(() => {
      body.classList.remove('print-mode-bw', 'print-mode-color');
    }, 500);
  }
};
