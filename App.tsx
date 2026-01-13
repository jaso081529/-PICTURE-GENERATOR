import React from 'react';
import StickerGenerator from './components/StickerGenerator';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f10] text-white selection:bg-red-500 selection:text-white">
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      <main className="relative z-10">
        <StickerGenerator />
      </main>

      <footer className="relative z-10 border-t border-zinc-900 mt-20 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Social Media Bild Generator. Powered by Google Gemini.</p>
        <p className="mt-2 text-xs opacity-50">Red Devils Division | Hoodplaka67 | JJ674 | PalzFlow</p>
      </footer>
    </div>
  );
};

export default App;