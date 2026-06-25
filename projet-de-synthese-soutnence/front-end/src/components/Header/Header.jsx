import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  Bot, 
  Users, 
  Scale, 
  LayoutDashboard, 
  MessageSquare, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  Settings, 
  CalendarCheck, 
  Wallet, 
  ChevronDown,
  Menu,
  FileText,
  LayoutGrid
} from "lucide-react";
import { io } from 'socket.io-client';
import api from '../../services/api';
import { BACKEND_URL, SOCKET_URL } from '../../config';
import "./Header.css";
import { useLanguage } from "../../context/LanguageContext";

function Header({ isDark, toggleDark, isLawyer, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    let userId = null;
    if (localUser) {
      const parsed = JSON.parse(localUser);
      setCurrentUser(parsed);
      userId = parsed.id;
    } else {
      setCurrentUser(null);
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
        console.error('Error fetching header navigation counts:', err);
      }
    };

    if (userId) {
      fetchCounts();

      const socket = io(SOCKET_URL);
      socket.emit('register', userId);

      socket.on('message', (msg) => {
        const isLawyerPage = window.location.pathname.startsWith('/lawyer-messages');
        const isUserPage = window.location.pathname.startsWith('/chat');
        if (!isLawyerPage && !isUserPage) {
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
  }, [location.pathname]);

  // Support guest mode by not returning null if currentUser is undefined

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Define dynamic paths
  const homePath = '/home';
  const chatPath = isLawyer ? '/lawyer-messages' : '/chat';
  const profilePath = currentUser ? `/profile/${currentUser.id}` : '#';
  const notifPath = isLawyer ? '/lawyer-notifications' : '/notifications';
  const settingsPath = isLawyer ? '/lawyer-settings' : '/settings';

  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <header className="header-topbar" dir={dir}>
      {/* Left side: Profile circular avatar + toggles */}
      <div className="topbar-left">
        {currentUser ? (
          /* User avatar dropdown */
          <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button className="profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="profile-avatar-circle">
                {currentUser.avatar_url ? (
                  <img src={`${BACKEND_URL}/storage/${currentUser.avatar_url}`} alt="Avatar" />
                ) : (
                  <span className="avatar-placeholder">{currentUser.name?.charAt(0).toUpperCase()}</span>
                )}
                <span className="online-dot"></span>
              </div>
              <ChevronDown size={14} className="dropdown-arrow-icon" />
            </button>

            {showDropdown && (
              <div className="profile-menu-dropdown animate-fade-in">
                <div className="user-details-header">
                  <span className="user-name-label">{currentUser.name}</span>
                  <span className="user-role-label">{isLawyer ? t('lawyerRole') : t('memberRole')}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => { navigate(profilePath); setShowDropdown(false); }}>
                  <User size={16} />
                  <span>{t('profile')}</span>
                </button>
                <button className="dropdown-item" onClick={() => { navigate(settingsPath); setShowDropdown(false); }}>
                  <Settings size={16} />
                  <span>{t('settings')}</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Guest Auth buttons */
          <div className="header-auth-buttons">
            <button className="header-login-btn" onClick={() => navigate('/login')}>
              {t('login')}
            </button>
            <button className="header-register-btn" onClick={() => navigate('/register')}>
              {t('register')}
            </button>
          </div>
        )}

        {/* Night Mode Switch */}
        <div className="night-mode-switch-container">
          <div className="night-mode-label-group">
            {isDark ? <Sun size={18} className="switch-icon yellow-text" /> : <Moon size={18} className="switch-icon" />}
            <span className="switch-text-label">{t('nightMode')}</span>
          </div>
          <button className={`switch-pill ${isDark ? 'on' : ''}`} onClick={toggleDark}>
            <span className="switch-thumb"></span>
          </button>
        </div>

        {/* Notifications */}
        {currentUser && (
          <button className="notifications-btn" onClick={() => navigate(notifPath)}>
            <Bell size={20} className="bell-icon" />
            {unreadNotificationsCount > 0 && (
              <span className="bell-badge-count">{unreadNotificationsCount}</span>
            )}
          </button>
        )}
      </div>

      {/* Center: Horizontal menu links (desktop only) */}
      <div className="topbar-center">
        <nav className="topbar-nav">
          {isLawyer ? (
            <>
              <NavLink to="/home" className={({ isActive }) => `topbar-menu-item ${isActive || location.pathname === '/' ? 'active' : ''}`}>
                <Home size={18} />
                <span>{t('home')}</span>
              </NavLink>
              <NavLink to="/lawyer-dashboard" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>{t('dashboard')}</span>
              </NavLink>
              <NavLink to="/contracts" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <FileText size={18} />
                <span>{t('contracts')}</span>
              </NavLink>
              <NavLink to="/community" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <LayoutGrid size={18} />
                <span>{t('community')}</span>
              </NavLink>
              <NavLink to="/lawyers" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <Users size={18} />
                <span>{t('lawyers')}</span>
              </NavLink>
              <NavLink to="/lawyer-appointments" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <CalendarCheck size={18} />
                <span>{t('appointments')}</span>
              </NavLink>
              <NavLink to="/lawyer-earnings" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <Wallet size={18} />
                <span>{t('earnings')}</span>
              </NavLink>
              <NavLink to="/lawyer-messages" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <div className="topbar-icon-badge-container">
                  <MessageSquare size={18} />
                  {unreadMessagesCount > 0 && <span className="topbar-item-badge">{unreadMessagesCount}</span>}
                </div>
                <span>{t('messages')}</span>
              </NavLink>
              <NavLink to={profilePath} className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <User size={18} />
                <span>{t('profile')}</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/home" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <Home size={18} />
                <span>{t('home')}</span>
              </NavLink>
              <NavLink to="/lawyers" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <Scale size={18} />
                <span>{t('lawyers')}</span>
              </NavLink>
              <NavLink to="/ai" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <Bot size={18} />
                <span>{t('aiAssistant')}</span>
              </NavLink>
              <NavLink to="/community" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                <Users size={18} />
                <span>{t('community')}</span>
              </NavLink>

              {currentUser && (
                <>
                  <NavLink to="/dashboard" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span>{t('myDashboard')}</span>
                  </NavLink>
                  <NavLink to="/chat" className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                    <div className="topbar-icon-badge-container">
                      <MessageSquare size={18} />
                      {unreadMessagesCount > 0 && <span className="topbar-item-badge">{unreadMessagesCount}</span>}
                    </div>
                    <span>{t('messages')}</span>
                  </NavLink>
                  <NavLink to={profilePath} className={({ isActive }) => `topbar-menu-item ${isActive ? 'active' : ''}`}>
                    <User size={18} />
                    <span>{t('profile')}</span>
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Right side: Mobile Hamburger menu + Logo */}
      <div className="topbar-right">
        <button className="topbar-hamburger-btn mobile-only" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="topbar-logo" onClick={() => navigate(homePath)}>
          <img src="/logo-transparent.png" className="logo-img" alt="حقي" />
          <span className="logo-text-brand">حقي</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
