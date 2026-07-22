import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Footer from './Footer';

/**
 * AppLayout — Complete layout with TopNav, Sidebar, and Footer based on new design.
 */
export default function AppLayout({ activePage, onNavigate, children }) {
  return (
    <div className="bg-gradient-to-br from-[#0b1120] via-[#111827] to-[#1e1b4b] text-on-surface antialiased flex flex-col h-screen overflow-hidden relative">
      {/* Decorative background orbs for glassmorphism to refract */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] pointer-events-none"></div>
      <TopNav />
      <div className="flex flex-1 pt-16 min-h-0 overflow-hidden z-10">
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        {/* Main Content Wrapper */}
        <main className="flex-1 w-full md:pl-64 h-full relative flex flex-col pb-8 overflow-hidden bg-transparent">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
