import React from 'react';
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Video, 
  CalendarCheck, 
  Wallet, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Scale,
  ChevronLeft,
  Sun,
  Moon,
  Users,
  User,
  Bot,
  FileText
} from "lucide-react";
import { io } from 'socket.io-client';
import api from '../../services/api';
import { SOCKET_URL } from '../../config';
import "./Sidebar.css"; 
import { useLanguage } from "../../context/LanguageContext";

const LawyerSidebar = ({ isOpen, toggleSidebar, isDark, toggleDark }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = React.useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);

  React.useEffect(() => {
    const localUser = localStorage.getItem('user');
    let userId = null;
    if (localUser) {
      const parsed = JSON.parse(localUser);
      setCurrentUser(parsed);
      userId = parsed.id;
    }

    const fetchCounts = async () => {
      try {
        const notifRes = await api.get('/notifications');
        const unreadNotifs = notifRes.data.filter(n => !n.read_at).length;
        setUnreadNotificationsCount(unreadNotifs);

        const contactsRes = await api.get('/messages/contacts');
        const totalUnreadMsgs = contactsRes.data.reduce((acc, c) => acc + (c.unread_count || 0), 0);
        setUnreadMessagesCount(totalUnreadMsgs);
      } catch (err) {
        console.error('Error fetching lawyer sidebar counts:', err);
      }
    };

    fetchCounts();

    if (userId) {
      const socket = io(SOCKET_URL);
      socket.emit('register', userId);

      socket.on('message', (msg) => {
        if (window.location.pathname !== '/lawyer-messages') {
          setUnreadMessagesCount(prev => prev + 1);
        }
      });

      socket.on('follow_request', () => {
        setUnreadNotificationsCount(prev => prev + 1);
      });

      socket.on('follow_accept', () => {
        setUnreadNotificationsCount(prev => prev + 1);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isOpen && (
        <button className="mobile-toggle" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      )}

      {/* Sidebar Content */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`} dir={dir}>
        <div className="sidebar-top">
          <div className="brand" onClick={() => navigate('/lawyer-dashboard')}>
             <img src="/logo-transparent.png" className="brand-logo-img" alt="حقي" />
             <div className="brand-info">
               <h2 className="brand-name">حقي</h2>
               <span className="brand-badge">{t('lawyerRole')}</span>
             </div>
          </div>
          <button className="close-btn mobile-only" onClick={toggleSidebar}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="sidebar-section">
          <nav className="sidebar-nav">
            <NavLink to="/lawyer-dashboard" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <Home size={18} /> <span>{t('dashboard')}</span>
            </NavLink>
            <NavLink to="/ai" className="menu-item ai-link" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <Bot size={18} /> <span>{t('aiAssistant')}</span>
            </NavLink>
            <NavLink to="/contracts" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <FileText size={18} /> <span>{t('contracts')}</span>
            </NavLink>
            <NavLink to="/community" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <Users size={18} /> <span>{t('community')}</span>
            </NavLink>
            <NavLink to="/lawyers" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <Scale size={18} /> <span>{t('lawyers')}</span>
            </NavLink>
            <NavLink to="/lawyer-appointments" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <CalendarCheck size={18} /> <span>{t('appointments')}</span>
            </NavLink>
            <NavLink to="/lawyer-earnings" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <Wallet size={18} /> <span>{t('earnings')}</span>
            </NavLink>
            <NavLink to="/lawyer-messages" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                <MessageSquare size={18} /> 
                <span>{t('messages')}</span>
                {unreadMessagesCount > 0 && <span className="sidebar-badge-count">{unreadMessagesCount}</span>}
              </div>
            </NavLink>
            {currentUser && (
              <NavLink to={`/profile/${currentUser.id}`} className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
                <User size={18} /> <span>{t('profile')}</span>
              </NavLink>
            )}
          </nav>
        </div>

        <div className="sidebar-section utility">
          <NavLink to="/lawyer-settings" className="menu-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
            <Settings size={18} /> <span>{t('settings')}</span>
          </NavLink>

          <NavLink to="/lawyer-notifications" className="menu-item notification-item" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
            <div className="notif-content">
              <Bell size={18} /> <span>{t('notifications')}</span>
            </div>
            {unreadNotificationsCount > 0 ? (
              <span className="sidebar-badge-count-red">{unreadNotificationsCount}</span>
            ) : (
              <span className="notif-dot-small"></span>
            )}
          </NavLink>

          <button className="menu-item dark-mode-menu-item" onClick={toggleDark}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />} <span>{isDark ? t('dayMode') : t('nightMode')}</span>
            <div className={`toggle-pill ${isDark ? 'on' : ''}`}>
              <div className="toggle-thumb"></div>
            </div>
          </button>
        </div>

        <div className="sidebar-cta">
          <div className="sidebar-divider"></div>
          <button 
            className="logout-link" 
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
              window.innerWidth < 768 && toggleSidebar();
            }}
          >
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>
      </div>
    </>
  );
};

export default LawyerSidebar;
