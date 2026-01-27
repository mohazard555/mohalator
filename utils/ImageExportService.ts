
/**
 * ImageExportService
 * خدمة متخصصة لتصدير العناصر كصور بجودة عالية ودعم كامل للعربية.
 */

export const ImageExportService = {
  /**
   * تصدير عنصر إلى صورة PNG
   * @param elementID معرف العنصر المطلوب تصديره
   * @param fileName اسم الملف الناتج
   */
  exportAsPng: async (element: HTMLElement, fileName: string) => {
    // @ts-ignore
    const htmlToImage = window.htmlToImage;
    
    if (!htmlToImage) {
      alert("مكتبة التصدير غير محملة");
      return;
    }

    try {
      // إعدادات خاصة لضمان جودة النصوص العربية
      const options = {
        quality: 1,
        pixelRatio: 2, // رفع الدقة لضمان وضوح الحروف الصغيرة
        skipFonts: false,
        fontEmbedCSS: undefined, // سيقوم تلقائياً بجلب الخطوط المستخدمة
        style: {
          // إجبار العنصر على أن يكون RTL أثناء اللقطة
          direction: 'rtl',
          textAlign: 'right'
        }
      };

      // تحويل العنصر إلى Base64
      const dataUrl = await htmlToImage.toPng(element, options);
      
      // تحميل الصورة
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export Error:', error);
      alert("حدث خطأ أثناء تصدير الصورة");
    }
  }
};
