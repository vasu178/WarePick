import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Footer from './Footer';

/**
 * AppLayout — Complete layout with TopNav, Sidebar, and Footer based on new design.
 */
export default function AppLayout({ activePage, onNavigate, children }) {
  return (
    <div className="bg-background text-on-surface antialiased flex flex-col h-screen overflow-hidden">
      <TopNav />
      <div className="flex flex-1 pt-16 min-h-0 overflow-hidden">
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        {/* Main Content Wrapper */}
        <main className="flex-1 w-full md:pl-64 h-full bg-background relative flex flex-col pb-8 overflow-hidden">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
