import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import { useDarkMode } from "./hooks/useDarkMode";

import Sidebar from "./components/Sidebar/Sidebar";
import LawyerSidebar from "./components/Sidebar/LawyerSidebar";
import BottomNavigation from "./components/BottomNavigation/BottomNavigation";
import Header from "./components/Header/Header";



import AiPage from "./pages/AiPage";
import HomePage from "./pages/HomePage";
import Lawyers from "./pages/Lawyers";
import DiscoverPage from "./pages/DiscoverPage";
import Dashboard from "./pages/Dashboard";
import Contracts from "./pages/Contracts";
import Pricing from "./pages/Pricing";
import UserSettings from "./pages/UserSettings";
import AiCategoryPage from "./pages/AiCategoryPage";
import LegalFieldPage from "./pages/LegalFieldPage";
import LawyerDashboard from "./pages/LawyerDashboard";
import LawyerAppointments from "./pages/LawyerAppointments";
import LawyerEarnings from "./pages/LawyerEarnings";
import LawyerMessages from "./pages/LawyerMessages";
import LawyerSettings from "./pages/LawyerSettings";
import LawyerNotifications from "./pages/LawyerNotifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import AnalysisResult from "./pages/AnalysisResult";
import ForgotPassword from "./pages/ForgotPassword";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import LawyerRegister from "./pages/LawyerRegister";
import AdminPanel from "./pages/AdminPanel";
import PendingApproval from "./pages/PendingApproval";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (localUser && token) {
      const user = JSON.parse(localUser);
      if (user.role === 'lawyer' && user.lawyer) {
        const status = user.lawyer.verification_status;
        if ((status === 'pending_review' || status === 'rejected') && 
            location.pathname !== '/pending-approval' && 
            location.pathname !== '/lawyer-register') {
          navigate('/pending-approval');
        }
      }
    }
  }, [location.pathname, navigate]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isAuthPage = 
    location.pathname === "/login" || 
    location.pathname === "/register" || 
    location.pathname === "/forgot-password" ||
    location.pathname === "/lawyer-register" ||
    location.pathname === "/secure-admin-8392" ||
    location.pathname === "/pending-approval";
  const lawyerRoutes = ["/lawyer-dashboard", "/lawyer-videos", "/lawyer-appointments", "/lawyer-earnings", "/lawyer-messages", "/lawyer-settings", "/lawyer-notifications"];
  const isLawyerPage = lawyerRoutes.some(route => location.pathname.startsWith(route));

  const localUser = localStorage.getItem('user');
  const currentUser = localUser ? JSON.parse(localUser) : null;
  const isLawyer = currentUser?.role === 'lawyer' || isLawyerPage;

  const { language } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className={`app-container ${isAuthPage ? 'auth-mode' : ''}`} dir={dir}>
      {!isAuthPage && (
        <Header 
          isDark={isDark} 
          toggleDark={toggleDark} 
          isLawyer={isLawyer} 
          toggleSidebar={toggleSidebar} 
        />
      )}
      {!isAuthPage && !isLawyer && (
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          isDark={isDark}
          toggleDark={toggleDark}
        />
      )}
      {!isAuthPage && isLawyer && (
        <LawyerSidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          isDark={isDark}
          toggleDark={toggleDark}
        />
      )}
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/ai/:category" element={<AiCategoryPage />} />
          <Route path="/field/:fieldName" element={<LegalFieldPage />} />
          <Route path="/lawyers" element={<Lawyers />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
          <Route path="/lawyer-appointments" element={<LawyerAppointments />} />
          <Route path="/lawyer-earnings" element={<LawyerEarnings />} />
          <Route path="/lawyer-messages" element={<LawyerMessages />} />
          <Route path="/lawyer-settings" element={<LawyerSettings />} />
          <Route path="/lawyer-notifications" element={<Notifications />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lawyer-register" element={<LawyerRegister />} />
          <Route path="/secure-admin-8392" element={<AdminPanel />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/analysis-result" element={<AnalysisResult />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </main>
      {!isAuthPage && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </Router>
  );
}

export default App;
