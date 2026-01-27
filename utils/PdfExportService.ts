
/**
 * PdfExportService (Production Grade)
 * نظام تصدير PDF يدعم اللغة العربية RTL بشكل كامل.
 */

export interface ExportOptions {
  element: HTMLElement;
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  format?: string;
  margin?: number | number[];
}

export const PdfExportService = {
  /**
   * تصدير العنصر إلى PDF بجودة عالية ودعم كامل للعربية
   */
  export: async ({ 
    element, 
    fileName, 
    orientation = 'portrait', 
    format = 'a4',
    margin = [10, 10, 10, 10] 
  }: ExportOptions) => {
    // @ts-ignore
    const html2pdf = window.html2pdf;
    
    if (!html2pdf) {
      alert('خطأ: مكتبة تصدير PDF غير محملة، يرجى التحقق من الاتصال.');
      return;
    }

    // إعدادات المحرك لضمان سلامة النصوص العربية
    const opt = {
      margin: margin,
      filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 1.0 }, // أعلى جودة للصور
      html2canvas: { 
        scale: 3, // دقة عالية للنصوص الصغيرة
        useCORS: true, 
        letterRendering: false, // هام جداً: تركه false يمنع تقطيع الحروف العربية
        logging: false,
        backgroundColor: '#ffffff',
        fontStyle: 'normal'
      },
      jsPDF: { 
        unit: 'mm', 
        format: format, 
        orientation: orientation,
        compress: true,
        precision: 16 // دقة الحسابات الرياضية للمسافات
      },
      // التحكم في فواصل الصفحات بناءً على CSS
      pagebreak: { 
        mode: ['css', 'legacy'], 
        before: '.pdf-page-break',
        avoid: 'tr' // تجنب قطع سطر الجدول في المنتصف
      }
    };

    try {
      // إجبار العنصر على وضع RTL قبل اللقطة لضمان اتجاه المحاذاة
      const originalDir = element.style.direction;
      element.style.direction = 'rtl';
      
      const result = await html2pdf().set(opt).from(element).save();
      
      // إعادة الحالة الأصلية
      element.style.direction = originalDir;
      return result;
    } catch (error) {
      console.error('PDF Export Critical Error:', error);
      throw error;
    }
  }
};
