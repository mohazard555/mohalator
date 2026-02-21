
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
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        letterRendering: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: format, 
        orientation: orientation,
        compress: true
      },
      pagebreak: { 
        mode: ['css', 'legacy'], 
        avoid: ['tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      }
    };

    try {
      // الانتظار حتى تحميل الخطوط لضمان ظهور النص العربي بشكل صحيح
      if (document.fonts) {
        await document.fonts.ready;
      }

      // إعداد العنصر للتصدير: إجبار RTL والمحاذاة لليمين والخط العربي
      const originalStyles = {
        direction: element.style.direction,
        textAlign: element.style.textAlign,
        fontFamily: element.style.fontFamily
      };

      element.style.direction = 'rtl';
      element.style.textAlign = 'right';
      element.style.fontFamily = "'Cairo', sans-serif";
      
      // إضافة كلاس مؤقت للمساعدة في التنسيق إذا لزم الأمر
      element.classList.add('export-container-fix');
      
      const result = await html2pdf().set(opt).from(element).save();
      
      // إعادة الحالة الأصلية
      element.style.direction = originalStyles.direction;
      element.style.textAlign = originalStyles.textAlign;
      element.style.fontFamily = originalStyles.fontFamily;
      element.classList.remove('export-container-fix');
      
      return result;
    } catch (error) {
      console.error('PDF Export Critical Error:', error);
      throw error;
    }
  }
};
