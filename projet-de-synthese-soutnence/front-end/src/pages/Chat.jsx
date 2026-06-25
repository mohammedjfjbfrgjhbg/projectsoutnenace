import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Paperclip, MoreHorizontal, User, ShieldCheck, FileText, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';
import './Chat.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    
    // Parse lawyer_id from query params if coming from Lawyers page
    const queryParams = new URLSearchParams(location.search);
    const initialContactId = queryParams.get('contact_id') || queryParams.get('lawyer_id');

    const [currentUser, setCurrentUser] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    
    const [isContactTyping, setIsContactTyping] = useState(false);
    const [contactOnlineStatuses, setContactOnlineStatuses] = useState({});

    // Stories States
    const [stories, setStories] = useState([]);
    const [activeStoryContact, setActiveStoryContact] = useState(null);
    const [activeStoryItemIndex, setActiveStoryItemIndex] = useState(0);
    const [viewedStories, setViewedStories] = useState(() => {
        const saved = localStorage.getItem('viewed-stories');
        return saved ? JSON.parse(saved) : [];
    });

    const [searchQuery, setSearchQuery] = useState('');

    const fileInputRef = useRef(null);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isContactTyping]);

    // Load current user
    useEffect(() => {
        const localUser = localStorage.getItem('user');
        if (localUser) {
            setCurrentUser(JSON.parse(localUser));
        }
    }, []);

    // Fetch contacts (based on accepted follow relationships)
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                setLoadingContacts(true);
                let responseData = [];
                try {
                    const response = await api.get('/messages/contacts');
                    responseData = response.data;
                } catch (apiErr) {
                    console.warn('API error fetching contacts, using mockup fallback:', apiErr);
                }

                if (responseData && responseData.length > 0) {
                    setContacts(responseData);

                    // Fetch initial online status from socket server
                    const userIds = responseData.map(c => c.id);
                    if (userIds.length > 0) {
                        try {
                            const statusRes = await fetch('http://localhost:3000/online-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userIds })
                            });
                            const statuses = await statusRes.json();
                            setContactOnlineStatuses(statuses);
                        } catch (e) {
                            console.warn("Could not retrieve initial online statuses: ", e);
                        }
                    }

                    // Set active contact
                    if (initialContactId) {
                        const target = responseData.find(l => l.id === parseInt(initialContactId));
                        setActiveContact(target || responseData[0]);
                    } else if (location.state?.selectedContact) {
                        const target = responseData.find(l => l.id === location.state.selectedContact.id);
                        setActiveContact(target || responseData[0]);
                    } else {
                        setActiveContact(responseData[0]);
                    }
                } else {
                    // Mockup fallback (exactly matches the mockup image)
                    const mockContacts = [
                        {
                            id: 990,
                            name: 'محمد الفاسي',
                            avatar: null,
                            role: 'lawyer',
                            lawyer: { avatar_color: '#2563eb', field: 'مستشار قانوني', city: 'فاس' }
                        },
                        {
                            id: 991,
                            name: 'أحمد الرامي',
                            avatar: null,
                            role: 'lawyer',
                            lawyer: { avatar_color: '#1e3a8a', field: 'ملخص استشارات المحتوى', city: 'الرباط' }
                        },
                        {
                            id: 992,
                            name: 'ليلى فاسي',
                            avatar: null,
                            role: 'lawyer',
                            lawyer: { avatar_color: '#0d9488', field: 'ملخص استشارات المحتوى', city: 'الدار البيضاء' }
                        },
                        {
                            id: 993,
                            name: 'سعيد الشامي',
                            avatar: null,
                            role: 'lawyer',
                            lawyer: { avatar_color: '#b45309', field: 'محامي', city: 'طنجة' }
                        }
                    ];
                    setContacts(mockContacts);
                    setActiveContact(mockContacts[0]);
                }
            } catch (err) {
                console.error('Error in fetchContacts:', err);
            } finally {
                setLoadingContacts(false);
            }
        };

        fetchContacts();
    }, [initialContactId, location.state]);

    // Generate mock stories when contacts list is loaded
    useEffect(() => {
        if (contacts.length > 0) {
            const mockImages = [
                'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1505664194779-8bebcb95df04?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=600&auto=format&fit=crop&q=80'
            ];
            
            // Map contacts to have mock stories or custom ones
            const list = contacts.map((c, index) => {
                const custom = localStorage.getItem(`custom-stories-${c.id}`);
                if (custom) {
                    const parsed = JSON.parse(custom);
                    if (parsed.length > 0) {
                        return {
                            ...c,
                            stories: parsed
                        };
                    }
                }
                const itemsCount = 2 + (index % 2); // 2 or 3 items
                const items = [];
                for (let i = 0; i < itemsCount; i++) {
                    items.push({
                        id: `${c.id}-story-${i}`,
                        url: mockImages[(index + i) % mockImages.length],
                        type: 'image'
                    });
                }
                return {
                    ...c,
                    stories: items
                };
            });
            setStories(list);
        }
    }, [contacts]);

    // Save viewed stories to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('viewed-stories', JSON.stringify(viewedStories));
    }, [viewedStories]);

    // Setup Socket.IO connection
    useEffect(() => {
        if (!currentUser) return;

        const socket = io('http://localhost:3000');
        socketRef.current = socket;
        socket.emit('register', currentUser.id);

        socket.on('message', (msg) => {
            // Check if active contact matches
            if (activeContact && (msg.sender_id === activeContact.id || msg.sender_id === currentUser.id)) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                
                // If it is from contact, mark seen
                if (msg.sender_id === activeContact.id) {
                    api.post('/messages/seen', { contact_id: activeContact.id });
                }
            } else {
                // Increment unread count in contact list
                setContacts(prev => prev.map(c => c.id === msg.sender_id ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c));
            }
        });

        socket.on('message_seen', (data) => {
            if (activeContact && data.receiver_id === activeContact.id) {
                setMessages(prev => prev.map(m => m.sender_id === currentUser.id ? { ...m, read_at: new Date() } : m));
            }
        });

        socket.on('typing', (data) => {
            if (activeContact && data.senderId === activeContact.id) {
                setIsContactTyping(data.isTyping);
            }
        });

        socket.on('user_status', (data) => {
            setContactOnlineStatuses(prev => ({
                ...prev,
                [data.userId]: data.status
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [currentUser, activeContact]);

    // Fetch messages when active contact changes
    useEffect(() => {
        if (!activeContact) return;

        const fetchMessages = async () => {
            try {
                setLoadingMessages(true);
                const response = await api.get('/messages', {
                    params: { contact_id: activeContact.id }
                });
                setMessages(response.data);
                setIsContactTyping(false);

                // Mark as seen immediately
                await api.post('/messages/seen', { contact_id: activeContact.id });
                setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, unread_count: 0 } : c));
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [activeContact]);

    const handleSendMessage = async (textToSend = null) => {
        const msgText = textToSend || input;
        if (!msgText.trim() || !activeContact || sending) return;

        setSending(true);
        try {
            const response = await api.post('/messages', {
                receiver_id: activeContact.id,
                message: msgText
            });

            setMessages(prev => [...prev, response.data]);
            setInput('');
            
            // Stop typing status
            if (socketRef.current) {
                socketRef.current.emit('typing', {
                    senderId: currentUser.id,
                    receiverId: activeContact.id,
                    isTyping: false
                });
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleTypingInput = (e) => {
        setInput(e.target.value);
        if (socketRef.current && activeContact && currentUser) {
            socketRef.current.emit('typing', {
                senderId: currentUser.id,
                receiverId: activeContact.id,
                isTyping: e.target.value.trim().length > 0
            });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeContact || sending) return;

        setSending(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('receiver_id', activeContact.id);

        try {
            const response = await api.post('/messages', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessages(prev => [...prev, response.data]);
        } catch (err) {
            console.error('Error uploading file:', err);
            alert(t('uploadFileError') || 'حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.');
        } finally {
            setSending(false);
        }
    };

    // Auto-advance logic for story viewer
    useEffect(() => {
        if (!activeStoryContact) return;

        const currentStories = activeStoryContact.stories || [];
        const timer = setTimeout(() => {
            if (activeStoryItemIndex < currentStories.length - 1) {
                // Next slide in current story
                setActiveStoryItemIndex(prev => prev + 1);
            } else {
                // Current contact's stories fully viewed! Mark as read
                if (!viewedStories.includes(activeStoryContact.id)) {
                    setViewedStories(prev => [...prev, activeStoryContact.id]);
                }
                
                // Find next contact with stories
                const currentContactIndex = stories.findIndex(s => s.id === activeStoryContact.id);
                if (currentContactIndex !== -1 && currentContactIndex < stories.length - 1) {
                    // Go to next contact's stories
                    setActiveStoryContact(stories[currentContactIndex + 1]);
                    setActiveStoryItemIndex(0);
                } else {
                    // Close the story viewer
                    setActiveStoryContact(null);
                    setActiveStoryItemIndex(0);
                }
            }
        }, 4000); // 4 seconds per story

        return () => clearTimeout(timer);
    }, [activeStoryContact, activeStoryItemIndex, stories, viewedStories]);

    const handleNextStoryItem = () => {
        if (!activeStoryContact) return;
        const currentStories = activeStoryContact.stories || [];
        if (activeStoryItemIndex < currentStories.length - 1) {
            setActiveStoryItemIndex(prev => prev + 1);
        } else {
            // Mark as read
            if (!viewedStories.includes(activeStoryContact.id)) {
                setViewedStories(prev => [...prev, activeStoryContact.id]);
            }
            // Next contact
            const currentContactIndex = stories.findIndex(s => s.id === activeStoryContact.id);
            if (currentContactIndex !== -1 && currentContactIndex < stories.length - 1) {
                setActiveStoryContact(stories[currentContactIndex + 1]);
                setActiveStoryItemIndex(0);
            } else {
                setActiveStoryContact(null);
                setActiveStoryItemIndex(0);
            }
        }
    };

    const handlePrevStoryItem = () => {
        if (!activeStoryContact) return;
        if (activeStoryItemIndex > 0) {
            setActiveStoryItemIndex(prev => prev - 1);
        } else {
            // Previous contact
            const currentContactIndex = stories.findIndex(s => s.id === activeStoryContact.id);
            if (currentContactIndex > 0) {
                const prevContact = stories[currentContactIndex - 1];
                setActiveStoryContact(prevContact);
                setActiveStoryItemIndex((prevContact.stories || []).length - 1);
            }
        }
    };

    const handleStoryClick = (contact) => {
        setActiveStoryContact(contact);
        setActiveStoryItemIndex(0);
    };

    const getMyCustomStories = () => {
        if (!currentUser) return [];
        const saved = localStorage.getItem(`custom-stories-${currentUser.id}`);
        return saved ? JSON.parse(saved) : [];
    };

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const fileAttachments = messages.filter(m => m.is_file);

    return (
        <div className="chat-container-premium" dir={dir}>

            {/* ── قصص أصدقائي (My Friends' Stories) — Full-width top banner ── */}
            {stories.length > 0 && (
                <div className="chat-stories-banner">
                    <div className="stories-banner-inner">
                        <h4 className="stories-banner-title">📖 {t('myFriendsStories')}</h4>
                        <div className="stories-horizontal-scroll">
                            {/* Current User's Story (قصتك) */}
                            {currentUser && (
                                <div 
                                    className={`story-circle-item mine ${getMyCustomStories().length > 0 ? 'unviewed' : ''}`}
                                    onClick={() => {
                                        const myStories = getMyCustomStories();
                                        if (myStories.length > 0) {
                                            setActiveStoryContact({
                                                id: currentUser.id,
                                                name: currentUser.name,
                                                avatar: currentUser.avatar,
                                                stories: myStories
                                            });
                                            setActiveStoryItemIndex(0);
                                        } else {
                                            navigate(`/profile/${currentUser.id}`);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="story-avatar-wrapper mine-story-avatar" style={getMyCustomStories().length > 0 ? {
                                        background: 'linear-gradient(45deg, #00f2fe 0%, #4facfe 30%, #d946ef 100%)',
                                        boxShadow: '0 0 10px rgba(0, 242, 254, 0.35)',
                                        padding: '3px'
                                    } : {}}>
                                        {currentUser.avatar ? (
                                            <img src={`http://localhost:8000${currentUser.avatar}`} alt="My avatar" className="story-avatar-img" />
                                        ) : (
                                            <div className="story-avatar-placeholder" style={{ background: '#0a58ca' }}>
                                                {currentUser.name.charAt(0)}
                                            </div>
                                        )}
                                        <span className="add-story-plus">+</span>
                                    </div>
                                    <span className="story-username">{t('yourStoryLabel')}</span>
                                </div>
                            )}
                            
                            {/* Contacts' Stories */}
                            {stories.map(c => {
                                const isViewed = viewedStories.includes(c.id);
                                return (
                                    <div 
                                        key={c.id} 
                                        className={`story-circle-item ${isViewed ? 'viewed' : 'unviewed'}`}
                                        onClick={() => handleStoryClick(c)}
                                    >
                                        <div className="story-avatar-wrapper">
                                            {c.avatar ? (
                                                <img src={`http://localhost:8000${c.avatar}`} alt={c.name} className="story-avatar-img" />
                                            ) : (
                                                <div className="story-avatar-placeholder" style={{ 
                                                    background: c.lawyer?.avatar_color || '#c9a84c'
                                                }}>
                                                    {c.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="story-username">{c.name.split(' ')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="chat-layout-premium">
                
                {/* Chat Sidebar: Followed contacts */}
                <div className="chat-info-panel animate-fade-in">
                    <h3 className="sidebar-title">{t('openConversationsTitle')}</h3>

                    {/* Search Bar */}
                    <div className="chat-search-wrapper">
                        <input 
                            type="text" 
                            placeholder={t('searchClientMessagesPlaceholder') || 'البحث عن موكل...'} 
                            className="chat-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <h4 className="contacts-section-title">{t('openConversationsTitle')}</h4>
                    
                    <div className="contacts-list-mini">
                        {loadingContacts ? (
                            <p className="loading-text">{t('loadingClientsMessages') || 'جاري تحميل الموكلين...'}</p>
                        ) : filteredContacts.length > 0 ? (
                            filteredContacts.map(c => {
                                const isOnline = contactOnlineStatuses[c.id] === 'online';
                                return (
                                    <div 
                                        key={c.id} 
                                        className={`contact-card-pill ${activeContact?.id === c.id ? 'active' : ''}`}
                                        onClick={() => setActiveContact(c)}
                                    >
                                        <div className="contact-main-info">
                                            <div className="avatar-container">
                                                {c.avatar ? (
                                                    <img src={`http://localhost:8000${c.avatar}`} alt={c.name} className="contact-avatar-img" />
                                                ) : (
                                                    <div className="avatar-letter" style={{ 
                                                        background: c.lawyer?.avatar_color || '#c9a84c'
                                                    }}>
                                                        {c.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                                            </div>
                                            <div className="contact-name-details">
                                                <h4 className="contact-name">{c.name}</h4>
                                                <span className="contact-role">{c.role === 'lawyer' ? c.lawyer?.field : t('memberRole')}</span>
                                            </div>
                                        </div>
                                        {c.unread_count > 0 && (
                                            <span className="unread-badge">{c.unread_count}</span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-contacts-box">
                                <p className="no-contacts-text">{t('noConversationsFound') || 'لا توجد محادثات موكلين حالياً.'}</p>
                            </div>
                        )}
                    </div>

                    {activeContact && (
                        <div className="panel-lawyer-card">
                            <div className="premium-avatar-box">
                                {activeContact.avatar ? (
                                    <img src={`http://localhost:8000${activeContact.avatar}`} alt={activeContact.name} className="active-avatar-img" />
                                ) : (
                                    <div className="avatar-letter large-avatar" style={{ 
                                        background: activeContact.lawyer?.avatar_color || '#c9a84c'
                                    }}>
                                        {activeContact.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h2 className="active-contact-name">{activeContact.name}</h2>
                            {activeContact.role === 'lawyer' && (
                                <span className="premium-badge"><ShieldCheck size={14} /> {t('certifiedLawyer')}</span>
                            )}
                            <p className="panel-desc">{activeContact.role === 'lawyer' ? `${activeContact.lawyer?.field} • ${activeContact.lawyer?.city}` : t('communityMemberLabel')}</p>
                        </div>
                    )}

                    {fileAttachments.length > 0 && (
                        <div className="panel-section file-attachments-section">
                            <h3><Paperclip size={18} /> {t('sharedFiles')} ({fileAttachments.length})</h3>
                            <div className="files-list">
                                {fileAttachments.map(fileMsg => (
                                    <div key={fileMsg.id} className="premium-file-card">
                                        <div className="file-icon"><FileText size={20} /></div>
                                        <div className="file-info">
                                            <p className="file-name">{fileMsg.file_name}</p>
                                            <p className="file-meta">{t('consultationFile')}</p>
                                        </div>
                                        <a href={`http://127.0.0.1:8000${fileMsg.file_path}`} target="_blank" rel="noopener noreferrer" className="download-btn">
                                            <Download size={16} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Chat Area */}
                <div className="chat-message-center">
                    <div className="chat-view-header">
                        <div className="header-info">
                            <h3>{t('liveChat')}</h3>
                            <p>{t('secureAndEncrypted')}</p>
                        </div>
                    </div>

                    <div className="premium-messages-list">
                        {loadingMessages ? (
                            <p className="loading-messages">{t('loading') || 'جاري التحميل...'}</p>
                        ) : messages.length > 0 ? (
                            messages.map((msg) => {
                                const isOwnMessage = msg.sender_id !== activeContact?.id;
                                const isSeen = msg.read_at !== null;
                                return (
                                    <div key={msg.id} className={`premium-msg-row ${isOwnMessage ? 'user' : 'lawyer'} animate-slide-up`}>
                                        <div className="msg-bubble-premium">
                                            {msg.is_file ? (
                                                <div className="file-msg-bubble">
                                                    <FileText size={24} className="file-bubble-icon" />
                                                    <div className="file-bubble-details">
                                                        <p className="file-bubble-name">{msg.file_name}</p>
                                                        <a href={`http://127.0.0.1:8000${msg.file_path}`} target="_blank" rel="noopener noreferrer" className="file-download-link">
                                                            {t('downloadFile')}
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="msg-text">{msg.message}</p>
                                            )}
                                            <div className="msg-time-status-wrap">
                                                <span className="msg-time">
                                                    {new Date(msg.created_at).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isOwnMessage && (
                                                    <span className={`msg-seen-status ${isSeen ? 'seen' : 'sent'}`}>
                                                        {isSeen ? `✓ ${t('seenLabel')}` : `✓ ${t('sentLabel')}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="no-messages-placeholder">{t('startConversationTip')}</p>
                        )}
                        {isContactTyping && (
                            <div className="premium-msg-row lawyer animate-slide-up">
                                <div className="msg-bubble-premium typing-bubble">
                                    <p className="msg-text typing-text">{t('typingLabel')}</p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="premium-input-box-wrap">
                        <div className="premium-input-inner">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleFileUpload} 
                            />
                            <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip size={20} />
                            </button>
                            <input 
                                type="text" 
                                placeholder={activeContact ? t('typeYourMessagePlaceholder') : t('selectUserFirst')} 
                                value={input}
                                onChange={handleTypingInput}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={!activeContact || sending}
                            />
                            <button 
                                className="premium-send-btn" 
                                onClick={() => handleSendMessage()}
                                disabled={!activeContact || sending}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── Story Viewer Modal (Instagram Style) ── */}
            {activeStoryContact && (
                <div className="story-viewer-backdrop" onClick={() => { setActiveStoryContact(null); setActiveStoryItemIndex(0); }}>
                    <div className="story-viewer-modal-premium" onClick={e => e.stopPropagation()}>
                        
                        {/* Header info */}
                        <div className="story-viewer-header">
                            <div className="story-author-info">
                                <div className="story-author-avatar">
                                    {activeStoryContact.avatar ? (
                                        <img src={`http://localhost:8000${activeStoryContact.avatar}`} alt={activeStoryContact.name} />
                                    ) : (
                                        <div className="story-avatar-placeholder-sm" style={{ background: activeStoryContact.lawyer?.avatar_color || '#c9a84c' }}>
                                            {activeStoryContact.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="story-author-meta">
                                    <span className="story-author-name">{activeStoryContact.name}</span>
                                    <span className="story-time-badge">{t('activeNow')}</span>
                                </div>
                            </div>
                            <button className="story-close-btn" onClick={() => { setActiveStoryContact(null); setActiveStoryItemIndex(0); }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress indicators */}
                        <div className="story-progress-indicators">
                            {(activeStoryContact.stories || []).map((item, idx) => {
                                let fillClass = '';
                                if (idx < activeStoryItemIndex) fillClass = 'filled';
                                else if (idx === activeStoryItemIndex) fillClass = 'filling';
                                
                                return (
                                    <div key={item.id} className="story-progress-bar-bg">
                                        <div className={`story-progress-bar-fill ${fillClass}`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Media Content */}
                        <div className="story-media-container">
                            <button className="story-nav-btn prev" onClick={handlePrevStoryItem}>
                                <ChevronRight size={28} />
                            </button>
                            
                            <img 
                                src={activeStoryContact.stories[activeStoryItemIndex]?.url} 
                                alt="Story slide" 
                                className="story-media-element"
                            />

                            <button className="story-nav-btn next" onClick={handleNextStoryItem}>
                                <ChevronLeft size={28} />
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
