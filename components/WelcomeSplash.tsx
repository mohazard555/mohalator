
import React, { useState, useEffect } from 'react';

interface WelcomeSplashProps {
  onComplete: () => void;
}

// شعار Finexa مدمج مباشرة ككود (Base64) لضمان الظهور الدائم
const FINEXA_LOGO_BASE64 = "https://i.ibb.co/3ykXF9n/Finexa-Logo.png";

const PHRASES = [
  "نبدأ من الأرقام لنصل إلى القرارات الصحيحة.",
  "حلول محاسبية تبسّط التعقيد.",
  "مع Finexa… الأرقام تعمل لصالحك.",
  "تقارير دقيقة… نتائج مؤكدة.",
  "تحليل أسرع… أداء أفضل.",
  "نحو إدارة مالية أكثر ذكاءً"
];

const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [status, setStatus] = useState<'enter' | 'active' | 'exit'>('enter');
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (currentIdx < PHRASES.length) {
      setStatus('enter');
      const timerActive = setTimeout(() => setStatus('active'), 200);
      const timerExit = setTimeout(() => setStatus('exit'), 2800);
      const timerNext = setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
      }, 3500);

      return () => {
        clearTimeout(timerActive);
        clearTimeout(timerExit);
        clearTimeout(timerNext);
      };
    } else {
      setIsDismissing(true);
      setTimeout(onComplete, 1200);
    }
  }, [currentIdx, onComplete]);

  return (
    <div className={`fixed inset-0 z-[3000] flex flex-col items-center justify-center bg-[#000000] transition-all duration-1000 ease-in-out overflow-hidden ${isDismissing ? 'scale-110 opacity-0 blur-3xl' : 'scale-100 opacity-100'}`}>
      
      {/* تأثيرات الخلفية 3D */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[160px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[140px] rounded-full animate-pulse-slow delay-700"></div>
        
        {/* جزيئات النجوم الطافية */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-float-3d"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDuration: Math.random() * 15 + 10 + 's',
                animationDelay: Math.random() * 5 + 's'
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-16 max-w-4xl px-10">
        
        {/* منطقة الشعار مع تأثير طفو وتوهج */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative animate-floating-logo">
            <img 
              src={FINEXA_LOGO_BASE64} 
              alt="Finexa Accounting" 
              className="w-72 h-72 md:w-[500px] md:h-auto object-contain drop-shadow-[0_0_60px_rgba(37,99,235,0.4)]"
            />
          </div>
        </div>

        {/* النصوص الترحيبية المتحركة */}
        <div className="h-32 flex items-center justify-center">
          {PHRASES[currentIdx] && (
            <h2 className={`text-3xl md:text-5xl font-black text-white leading-tight transition-all duration-1000 transform-gpu
              ${status === 'enter' ? 'opacity-0 translate-y-10 scale-90 blur-xl' : 
                status === 'active' ? 'opacity-100 translate-y-0 scale-100 blur-0' : 
                'opacity-0 -translate-y-10 scale-110 blur-xl'}
            `}>
              {PHRASES[currentIdx]}
            </h2>
          )}
        </div>

        {/* مؤشر التقدم السفلي */}
        <div className="flex gap-3 items-center">
          {PHRASES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-700 ${i === currentIdx ? 'w-20 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'w-4 bg-zinc-800'}`}
            ></div>
          ))}
        </div>
      </div>

      {/* العلامة التجارية السفلية */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-20">
        <span className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.8em]">Finexa Intelligence Platform</span>
        <div className="h-px w-64 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
      </div>

      <style>{`
        @keyframes floating-logo {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(2deg); }
        }
        @keyframes float-3d {
          0% { transform: translateZ(0) translateY(100vh); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          100% { transform: translateZ(500px) translateY(-100vh); opacity: 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        .animate-floating-logo { animation: floating-logo 8s ease-in-out infinite; }
        .animate-float-3d { animation: float-3d linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default WelcomeSplash;
