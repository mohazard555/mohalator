
/**
 * ImageExportService
 * خدمة متخصصة لتصدير العناصر كصور بجودة عالية ودعم كامل للعربية.
 */

export const ImageExportService = {
  /**
   * تصدير عنصر إلى صورة PNG
   * @param element معرف العنصر المطلوب تصديره
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
      // إعدادات خاصة لضمان جودة النصوص العربية واستبعاد العناصر غير المرغوبة
      const options = {
        quality: 1,
        pixelRatio: 3, // رفع الدقة لضمان وضوح فائق
        skipFonts: false,
        // فلتر لاستبعاد أي عنصر يحمل كلاس no-print
        filter: (node: HTMLElement) => {
          if (node.classList && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
        style: {
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
