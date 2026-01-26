
/**
 * PdfExportService
 * يوفر واجهة موحدة لتصدير عناصر HTML إلى ملفات PDF احترافية.
 */

export interface ExportOptions {
  element: HTMLElement;
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  format?: string;
}

export const PdfExportService = {
  /**
   * تصدير العنصر المحدد إلى ملف PDF
   * يعتمد على وجود مكتبة html2pdf.js المحملة عبر CDN في index.html
   */
  export: async ({ element, fileName, orientation = 'portrait', format = 'a4' }: ExportOptions) => {
    // @ts-ignore - html2pdf يتم تحميله عالمياً عبر CDN
    const html2pdf = window.html2pdf;
    
    if (!html2pdf) {
      console.error('مكتبة html2pdf.js غير موجودة. يرجى التأكد من اتصال الإنترنت.');
      alert('خطأ: مكتبة تصدير PDF غير محملة.');
      return;
    }

    const opt = {
      margin: [10, 10, 10, 10],
      filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: format, 
        orientation: orientation,
        compress: true
      }
    };

    try {
      return await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('فشل تصدير PDF:', error);
      throw error;
    }
  }
};
