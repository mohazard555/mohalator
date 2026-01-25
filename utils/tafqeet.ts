
/**
 * نظام تفقيط الأرقام باللغة العربية
 * محول الأرقام إلى كلمات
 */

const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const hundreds = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];

function convertThreeDigits(n: number): string {
    if (n === 0) return "";
    let res = "";

    // المئات
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    if (h > 0) {
        res += hundreds[h];
    }

    if (remainder > 0) {
        if (res !== "") res += " و";
        if (remainder < 20) {
            res += ones[remainder];
        } else {
            const t = Math.floor(remainder / 10);
            const o = remainder % 10;
            if (o > 0) {
                res += ones[o] + " و" + tens[t];
            } else {
                res += tens[t];
            }
        }
    }

    return res;
}

export function tafqeet(n: number, currencyName: string = "ليرة سورية"): string {
    if (n === 0) return "صفر " + currencyName;
    if (n < 0) return "سالب " + tafqeet(Math.abs(n), currencyName);

    let res = "";
    const groups = [];
    let tempN = Math.floor(n);

    while (tempN > 0) {
        groups.push(tempN % 1000);
        tempN = Math.floor(tempN / 1000);
    }

    const groupNames = ["", "ألف", "مليون", "مليار", "ترليون"];

    for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] === 0) continue;

        let groupText = convertThreeDigits(groups[i]);
        let name = groupNames[i];

        // معالجة خاصة للمثنى والجمع في الألوف والملايين
        if (i === 1) { // آلاف
            if (groups[i] === 1) groupText = "ألف";
            else if (groups[i] === 2) groupText = "ألفان";
            else if (groups[i] >= 3 && groups[i] <= 10) name = "آلاف";
        } else if (i === 2) { // ملايين
            if (groups[i] === 1) groupText = "مليون";
            else if (groups[i] === 2) groupText = "مليونان";
            else if (groups[i] >= 3 && groups[i] <= 10) name = "ملايين";
        } else if (i === 3) { // مليارات
            if (groups[i] === 1) groupText = "مليار";
            else if (groups[i] === 2) groupText = "ملياران";
            else if (groups[i] >= 3 && groups[i] <= 10) name = "مليارات";
        }

        const part = (i > 0 && groups[i] > 2) ? (groupText + " " + name) : groupText;
        
        if (res !== "") res += " و";
        res += part;
    }

    return res.trim() + " " + currencyName + " فقط لا غير";
}
