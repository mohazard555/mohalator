
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
    // @ts-ignore
    const htmlToImage = window.htmlToImage;
    
    if (!html2pdf || !htmlToImage) {
      alert('خطأ: مكتبات تصدير PDF غير محملة، يرجى التحقق من الاتصال.');
      return;
    }

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
      
      // استخدام html-to-image بدلاً من html2canvas لدعم اللغة العربية بشكل مثالي
      const canvas = await htmlToImage.toCanvas(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          direction: 'rtl',
          fontFamily: "'Cairo', sans-serif"
        }
      });

      // إعدادات المحرك لإنشاء الـ PDF من الـ Canvas
      const opt = {
        margin: margin,
        filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        jsPDF: { 
          unit: 'mm', 
          format: format, 
          orientation: orientation,
          compress: true
        }
      };

      const result = await html2pdf().set(opt).from(canvas).save();
      
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
