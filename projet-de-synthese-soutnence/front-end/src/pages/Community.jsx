import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  Trash2, 
  Image as ImageIcon, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  MoreVertical,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Scale,
  User,
  Users,
  FileText,
  MessageSquare,
  Flame,
  Shield,
  Lock,
  Paperclip,
  BarChart2,
  Globe,
  CheckCircle2,
  HelpCircle,
  Award,
  FolderPlus,
  Check
} from 'lucide-react';
import postService from '../services/post.service';
import { BACKEND_URL } from '../config';
import './Community.css';
import { useLanguage } from '../context/LanguageContext';
import { useCustomAlert } from '../context/CustomAlertContext';

const Community = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { showConfirm } = useCustomAlert();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState('latest'); // 'latest', 'interactive', 'viewed'
  const [savedPosts, setSavedPosts] = useState({}); // { postId: boolean }
  const [likedHearts, setLikedHearts] = useState({}); // { postId: boolean }

  // Save/Collection Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalPostId, setSaveModalPostId] = useState(null);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [stats, setStats] = useState({ total_users: 0, total_posts: 0, total_lawyers: 0 });
  
  // Post Creation States
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Comment States
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({}); // { postId: 'text' }
  const [replyInputs, setReplyInputs] = useState({}); // { commentId: 'text' }
  const [activeReplyId, setActiveReplyId] = useState(null); // ID of comment being replied to

  // Carousels active indexes
  const [carouselIndexes, setCarouselIndexes] = useState({}); // { postId: index }

  const fileInputRef = useRef(null);

  useEffect(() => {
    // 1. Get current user
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setCurrentUser(JSON.parse(localUser));
    }

    // 2. Fetch posts
    fetchPosts();

    // 3. Fetch stats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await postService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postService.getPosts();
      setPosts(data);
      // Build saved state from is_saved flag
      const savedMap = {};
      data.forEach(post => {
        if (post.is_saved) savedMap[post.id] = true;
      });
      setSavedPosts(savedMap);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const data = await postService.getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  };

  // Image Selection Handler
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImagePreview = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && selectedImages.length === 0) return;

    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      selectedImages.forEach((image) => {
        formData.append('images[]', image);
      });

      const res = await postService.createPost(formData);
      
      // Prepend the new post
      setPosts((prev) => [res.post, ...prev]);

      // Update stats count locally
      setStats((prev) => ({
        ...prev,
        total_posts: prev.total_posts + 1
      }));

      // Reset Form
      setPostContent('');
      setSelectedImages([]);
      setImagePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setPosting(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    const isConfirmed = await showConfirm(t('confirmDeletePost'));
    if (!isConfirmed) return;

    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      
      // Update stats count locally
      setStats((prev) => ({
        ...prev,
        total_posts: Math.max(0, prev.total_posts - 1)
      }));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Like Post
  const handleLikePost = async (postId) => {
    try {
      const res = await postService.toggleLike(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, is_liked: res.is_liked, likes_count: res.likes_count }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Add Comment
  const handleAddComment = async (postId, parentId = null) => {
    const text = parentId ? replyInputs[parentId] : commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await postService.addComment(postId, text, parentId);
      
      // Update local posts state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          let updatedComments = [...post.comments];
          if (parentId) {
            // Add as reply
            updatedComments = updatedComments.map((comm) => {
              if (comm.id === parentId) {
                return { ...comm, replies: [...(comm.replies || []), res.comment] };
              }
              return comm;
            });
          } else {
            // Add as root comment
            updatedComments = [...updatedComments, res.comment];
          }

          return {
            ...post,
            comments_count: post.comments_count + 1,
            comments: updatedComments,
          };
        })
      );

      // Clear inputs
      if (parentId) {
        setReplyInputs((prev) => ({ ...prev, [parentId]: '' }));
        setActiveReplyId(null);
      } else {
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId, commentId, parentId = null) => {
    const isConfirmed = await showConfirm(t('confirmDeleteComment'));
    if (!isConfirmed) return;

    try {
      await postService.deleteComment(commentId);

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          let updatedComments = [...post.comments];
          if (parentId) {
            // Delete reply
            updatedComments = updatedComments.map((comm) => {
              if (comm.id === parentId) {
                return {
                  ...comm,
                  replies: comm.replies.filter((r) => r.id !== commentId),
                };
              }
              return comm;
            });
          } else {
            // Delete root comment
            updatedComments = updatedComments.filter((c) => c.id !== commentId);
          }

          return {
            ...post,
            comments_count: Math.max(0, post.comments_count - 1),
            comments: updatedComments,
          };
        })
      );
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Like/Dislike Comment
  const handleCommentVote = async (postId, commentId, isLike, parentId = null) => {
    try {
      const res = await postService.toggleCommentLike(commentId, isLike);

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          const updateVotes = (c) => {
            if (c.id === commentId) {
              return {
                ...c,
                user_liked: res.user_liked,
                likes_count: res.likes_count,
                dislikes_count: res.dislikes_count,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId
                    ? {
                        ...r,
                        user_liked: res.user_liked,
                        likes_count: res.likes_count,
                        dislikes_count: res.dislikes_count,
                      }
                    : r
                ),
              };
            }
            return c;
          };

          return {
            ...post,
            comments: post.comments.map(updateVotes),
          };
        })
      );
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };

  // Carousel Navigation
  const prevSlide = (postId, max) => {
    setCarouselIndexes((prev) => {
      const cur = prev[postId] || 0;
      const next = cur === 0 ? max - 1 : cur - 1;
      return { ...prev, [postId]: next };
    });
  };

  const nextSlide = (postId, max) => {
    setCarouselIndexes((prev) => {
      const cur = prev[postId] || 0;
      const next = cur === max - 1 ? 0 : cur + 1;
      return { ...prev, [postId]: next };
    });
  };

  // Helpers
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('timeNow');
    if (diffMins < 60) {
      if (language === 'darija') return `منذ ${diffMins} دقيقة`;
      if (language === 'fr') return `il y a ${diffMins} min`;
      return `${diffMins} mins ago`;
    }
    if (diffHours < 24) {
      if (language === 'darija') return `منذ ${diffHours} ساعة`;
      if (language === 'fr') return `il y a ${diffHours} h`;
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return t('timeYesterday');
    if (language === 'darija') return `منذ ${diffDays} أيام`;
    if (language === 'fr') return `il y a ${diffDays} jours`;
    return `${diffDays} days ago`;
  };

  const getUserInitials = (name) => {
    return name ? name.charAt(0) : '⚖️';
  };

  const getAvatarColor = (postOrCommentUser) => {
    if (postOrCommentUser.role === 'lawyer' && postOrCommentUser.lawyer?.avatar_color) {
      return postOrCommentUser.lawyer.avatar_color;
    }
    // Generate hashed color for standard user name
    const name = postOrCommentUser.name || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#064e3b', '#0369a1', '#b45309', '#9d174d', '#0f766e', '#1e3a8a', '#d97706'];
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  const getSortedPosts = () => {
    if (!posts) return [];
    let postsCopy = [...posts];
    if (activeTab === 'interactive') {
      return postsCopy.sort((a, b) => (b.comments_count + b.likes_count) - (a.comments_count + a.likes_count));
    } else if (activeTab === 'viewed') {
      return postsCopy.sort((a, b) => {
        const scoreA = (a.likes_count * 5 + a.comments_count * 10) + (a.id % 7) * 12;
        const scoreB = (b.likes_count * 5 + b.comments_count * 10) + (b.id % 7) * 12;
        return scoreB - scoreA;
      });
    }
    return postsCopy;
  };

  // Save post: if already saved → unsave immediately; if not saved → open modal
  const handleSaveClick = async (postId) => {
    if (savedPosts[postId]) {
      // Unsave immediately
      try {
        await postService.toggleSave(postId);
        setSavedPosts(prev => ({ ...prev, [postId]: false }));
      } catch (err) {
        console.error('Error unsaving post:', err);
      }
    } else {
      // Open save modal to choose collection
      setSaveModalPostId(postId);
      setShowSaveModal(true);
      fetchCollections();
    }
  };

  // Save post to a specific collection (or no collection)
  const savePostToCollection = async (collectionId = null) => {
    if (!saveModalPostId) return;
    setSavingPost(true);
    try {
      await postService.toggleSave(saveModalPostId, collectionId);
      setSavedPosts(prev => ({ ...prev, [saveModalPostId]: true }));
      setShowSaveModal(false);
      setSaveModalPostId(null);
    } catch (err) {
      console.error('Error saving post:', err);
    } finally {
      setSavingPost(false);
    }
  };

  // Create a new collection and save the post to it
  const handleCreateCollectionAndSave = async () => {
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const data = await postService.createCollection(newCollectionName.trim());
      setNewCollectionName('');
      // Save post to the new collection
      await savePostToCollection(data.collection?.id || data.id);
      fetchCollections();
    } catch (err) {
      console.error('Error creating collection:', err);
    } finally {
      setCreatingCollection(false);
    }
  };

  const toggleHeart = (postId) => {
    setLikedHearts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const sortedPosts = getSortedPosts();

  return (
    <div className="community-page-container" dir={dir}>
      <div className="community-content-grid">
        
        {/* ── Center / Main Column ── */}
        <div className="feed-column">
          
          {/* ── Premium Blue Hero Banner ── */}
          <div className="community-hero-banner">
            <div className="banner-bg-pattern"></div>
            <div className="banner-content">
              {/* Scale of Justice SVG Graphic */}
              <div className="banner-graphic">
                <svg viewBox="0 0 200 200" className="scale-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Stand / Base */}
                  <path d="M100 160 L100 50" stroke="#c9a84c" strokeWidth="6" strokeLinecap="round" />
                  <path d="M70 165 L130 165" stroke="#c9a84c" strokeWidth="8" strokeLinecap="round" />
                  <path d="M60 173 L140 173" stroke="#c9a84c" strokeWidth="6" strokeLinecap="round" />
                  <path d="M100 45 L100 50" stroke="#c9a84c" strokeWidth="8" strokeLinecap="round" />
                  {/* Beam */}
                  <path d="M40 70 L160 70" stroke="#c9a84c" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="100" cy="70" r="8" fill="#aa8a3c" />
                  <circle cx="40" cy="70" r="5" fill="#aa8a3c" />
                  <circle cx="160" cy="70" r="5" fill="#aa8a3c" />
                  
                  {/* Left Pan */}
                  <path d="M40 70 L25 120 M40 70 L55 120" stroke="#daa520" strokeWidth="2" />
                  <path d="M20 120 L60 120 Q40 135 20 120" fill="#c9a84c" stroke="#aa8a3c" strokeWidth="2" />
                  
                  {/* Right Pan */}
                  <path d="M160 70 L145 120 M160 70 L175 120" stroke="#daa520" strokeWidth="2" />
                  <path d="M140 120 L180 120 Q160 135 140 120" fill="#c9a84c" stroke="#aa8a3c" strokeWidth="2" />
                  
                  {/* Gavel & Book decorative backdrop */}
                  <rect x="75" y="145" width="50" height="12" rx="2" fill="#aa8a3c" opacity="0.8" />
                </svg>
              </div>

              <div className="banner-text">
                <h1 className="banner-title">{t('communityTitle')}</h1>
                <p className="banner-subtitle">
                  {t('communitySubtitleAlt')}
                </p>
              </div>
            </div>

            {/* Stats Overlay Cards */}
            <div className="banner-stats-container">
              <div className="stat-card">
                <div className="stat-icon-wrapper blue-bg">
                  <Users size={20} className="stat-icon" />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.total_users}</span>
                  <span className="stat-label">{t('communityMembers')}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon-wrapper blue-bg">
                  <FileText size={20} className="stat-icon" />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.total_posts}</span>
                  <span className="stat-label">{t('communityPost')}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon-wrapper blue-bg">
                  <Scale size={20} className="stat-icon" />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.total_lawyers}</span>
                  <span className="stat-label">{t('lawyerAndConsultant')}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* ── Create Post Box ("ماذا تريد أن تسأل اليوم؟") ── */}
          {currentUser && (
            <div className="create-post-card-premium animate-fade-in">
              <form onSubmit={handleCreatePost}>
                <h3 className="create-post-title">{t('askQuestionToday')}</h3>
                
                <div className="create-post-body-row">
                  <div 
                    className="user-avatar-circle" 
                    style={{ backgroundColor: getAvatarColor(currentUser) }}
                  >
                    {currentUser.avatar ? (
                      <img src={`${BACKEND_URL}${currentUser.avatar}`} alt={currentUser.name} />
                    ) : (
                      getUserInitials(currentUser.name)
                    )}
                  </div>
                  
                  <div className="textarea-container">
                    <textarea
                      placeholder={t('writeLegalQuestion')}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Previews if any */}
                {imagePreviews.length > 0 && (
                  <div className="image-previews-container">
                    {imagePreviews.map((url, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={url} alt="upload preview" />
                        <button 
                          type="button" 
                          className="remove-preview"
                          onClick={() => removeImagePreview(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="create-post-actions-row">
                  <div className="post-attachments">
                    <button 
                      type="button" 
                      className="attachment-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={18} className="attachment-icon blue-text" />
                      <span>{t('image')}</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      multiple 
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    
                    <button type="button" className="attachment-btn" onClick={() => alert('إرفاق ملف غير متاح حالياً')}>
                      <Paperclip size={18} className="attachment-icon blue-text" />
                      <span>{t('file')}</span>
                    </button>
                    
                    <button type="button" className="attachment-btn" onClick={() => alert('إنشاء استطلاع غير متاح حالياً')}>
                      <BarChart2 size={18} className="attachment-icon blue-text" />
                      <span>{t('poll')}</span>
                    </button>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="publish-submit-btn" 
                    disabled={posting || (!postContent.trim() && selectedImages.length === 0)}
                  >
                    <span>{t('publishBtn')}</span>
                    <Send size={15} className="publish-icon" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Filter Tabs ── */}
          <div className="feed-filter-tabs">
            <button 
              className={`filter-tab-btn ${activeTab === 'latest' ? 'active' : ''}`}
              onClick={() => setActiveTab('latest')}
            >
              {t('latest')}
            </button>
            <button 
              className={`filter-tab-btn ${activeTab === 'interactive' ? 'active' : ''}`}
              onClick={() => setActiveTab('interactive')}
            >
              {t('mostInteractive')}
            </button>
            <button 
              className={`filter-tab-btn ${activeTab === 'viewed' ? 'active' : ''}`}
              onClick={() => setActiveTab('viewed')}
            >
              {t('mostViewed')}
            </button>
          </div>

          {/* ── Feed List ── */}
          {loading ? (
            <div className="feed-loading">
              <div className="spinner"></div>
              <p>{t('loadingPosts')}</p>
            </div>
          ) : sortedPosts.length > 0 ? (
            <div className="posts-list-container">
              {sortedPosts.map((post) => {
                const activeIndex = carouselIndexes[post.id] || 0;
                const hasImages = post.images && post.images.length > 0;
                const isSaved = savedPosts[post.id] || false;
                const isHearted = likedHearts[post.id] || false;
                const simulatedHeartCount = (post.likes_count * 2) + 108 + (post.id % 5) * 4 + (isHearted ? 1 : 0);
                
                return (
                  <article key={post.id} className="post-card-premium animate-fade-in">
                    
                    {/* Header */}
                    <div className="post-header-premium">
                      <div 
                        className="post-author-row" 
                        onClick={() => navigate('/profile/' + post.user.id)}
                      >
                        <div 
                          className="user-avatar-circle" 
                          style={{ backgroundColor: getAvatarColor(post.user) }}
                        >
                          {post.user.avatar ? (
                            <img src={`${BACKEND_URL}${post.user.avatar}`} alt={post.user.name} />
                          ) : (
                            getUserInitials(post.user.name)
                          )}
                        </div>
                        <div className="author-meta-info">
                          <div className="author-name-badge">
                            <span className="author-name-text">{post.user.name}</span>
                            <CheckCircle2 size={15} className="verified-badge-icon" />
                            <span className="trusted-status-text">عضو موثوق</span>
                          </div>
                          <div className="post-time-meta">
                            <span className="time-text">{formatTimeAgo(post.created_at)}</span>
                            <Globe size={12} className="globe-icon" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="post-header-actions">
                        {currentUser && currentUser.id === post.user_id ? (
                          <button 
                            className="delete-post-action-btn"
                            onClick={() => handleDeletePost(post.id)}
                            title="حذف المنشور"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button className="post-more-options-btn">
                            <MoreVertical size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="post-body-premium">
                      {post.content && <p className="post-text-content">{post.content}</p>}
                      
                      {/* Image Slider */}
                      {hasImages && (
                        <div className="post-images-slider-premium">
                          <div 
                            className="slider-wrapper-premium"
                            style={{ transform: `translateX(${activeIndex * 100}%)` }}
                          >
                            {post.images.map((imgUrl, i) => (
                              <div key={i} className="slide-premium">
                                <img src={`${BACKEND_URL}${imgUrl}`} alt={`Post img ${i + 1}`} />
                              </div>
                            ))}
                          </div>

                          {post.images.length > 1 && (
                            <>
                              <button 
                                className="slider-nav-btn prev"
                                onClick={() => prevSlide(post.id, post.images.length)}
                              >
                                <ChevronRight size={20} />
                              </button>
                              <button 
                                className="slider-nav-btn next"
                                onClick={() => nextSlide(post.id, post.images.length)}
                              >
                                <ChevronLeft size={20} />
                              </button>

                              <div className="slider-indicators">
                                {post.images.map((_, i) => (
                                  <span 
                                    key={i} 
                                    className={`indicator-dot ${activeIndex === i ? 'active' : ''}`}
                                    onClick={() => setCarouselIndexes({...carouselIndexes, [post.id]: i})}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer / Actions Bar */}
                    <div className="post-footer-actions-bar">
                      <div className="actions-left-group">
                        <button 
                          className={`post-action-btn ${post.is_liked ? 'active-thumb' : ''}`}
                          onClick={() => handleLikePost(post.id)}
                        >
                          <ThumbsUp size={18} />
                          <span className="action-count-label">{post.likes_count}</span>
                        </button>

                        <button 
                          className={`post-action-btn ${activeCommentPostId === post.id ? 'active-comment' : ''}`}
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        >
                          <MessageCircle size={18} />
                          <span className="action-count-label">{post.comments_count}</span>
                        </button>

                        <button 
                          className={`post-action-btn ${isSaved ? 'active-bookmark saved-check' : ''}`}
                          onClick={() => handleSaveClick(post.id)}
                          title={isSaved ? 'إزالة الحفظ' : 'حفظ المنشور'}
                        >
                          {isSaved ? (
                            <BookmarkCheck size={18} className="saved-icon-animated" />
                          ) : (
                            <Bookmark size={18} />
                          )}
                        </button>

                        <button className="post-action-btn" onClick={() => alert('تم نسخ رابط المنشور')}>
                          <Share2 size={18} />
                        </button>
                      </div>

                      <button 
                        className={`post-action-btn heart-btn ${isHearted ? 'active-heart' : ''}`}
                        onClick={() => toggleHeart(post.id)}
                      >
                        <span className="action-count-label">{simulatedHeartCount}</span>
                        <Heart size={18} fill={isHearted ? 'red' : 'none'} stroke={isHearted ? 'red' : 'currentColor'} />
                      </button>
                    </div>

                    {/* Comments Panel */}
                    {activeCommentPostId === post.id && (
                      <div className="comments-panel-premium">
                        
                        {/* New Comment Input */}
                        {currentUser && (
                          <div className="new-comment-input-row">
                            <div 
                              className="user-avatar-circle size-sm" 
                              style={{ backgroundColor: getAvatarColor(currentUser) }}
                            >
                              {currentUser.avatar ? (
                                <img src={`${BACKEND_URL}${currentUser.avatar}`} alt={currentUser.name} />
                              ) : (
                                getUserInitials(currentUser.name)
                              )}
                            </div>
                            <div className="comment-text-input-field">
                              <input 
                                type="text"
                                placeholder="اكتب تعليقك هنا..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(post.id);
                                }}
                              />
                              <button 
                                className="comment-submit-icon-btn"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                              >
                                <Send size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Comments Thread */}
                        <div className="comments-list-thread">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                              <div key={comment.id} className="comment-thread-item">
                                
                                {/* Parent Comment */}
                                <div className="parent-comment-card">
                                  <div 
                                    className="user-avatar-circle size-sm" 
                                    style={{ backgroundColor: getAvatarColor(comment.user), cursor: 'pointer' }}
                                    onClick={() => navigate('/profile/' + comment.user.id)}
                                  >
                                    {comment.user.avatar ? (
                                      <img src={`${BACKEND_URL}${comment.user.avatar}`} alt={comment.user.name} />
                                    ) : (
                                      getUserInitials(comment.user.name)
                                    )}
                                  </div>
                                  <div className="comment-text-wrapper">
                                    <div className="commenter-meta-row">
                                      <span 
                                        className="commenter-name-text"
                                        onClick={() => navigate('/profile/' + comment.user.id)}
                                      >
                                        {comment.user.name}
                                      </span>
                                      {comment.user.role === 'lawyer' && (
                                        <span className="lawyer-badge-small">محامي معتمد</span>
                                      )}
                                      <span className="comment-time-text">{formatTimeAgo(comment.created_at)}</span>
                                    </div>
                                    <p className="comment-body-content">{comment.content}</p>
                                    
                                    {/* Action row */}
                                    <div className="comment-card-actions">
                                      <button 
                                        className={`comment-thumb-btn ${comment.user_liked === true ? 'liked' : ''}`}
                                        onClick={() => handleCommentVote(post.id, comment.id, true)}
                                      >
                                        <ThumbsUp size={12} />
                                        <span>{comment.likes_count}</span>
                                      </button>
                                      <button 
                                        className={`comment-thumb-btn ${comment.user_liked === false ? 'disliked' : ''}`}
                                        onClick={() => handleCommentVote(post.id, comment.id, false)}
                                      >
                                        <ThumbsDown size={12} />
                                        <span>{comment.dislikes_count}</span>
                                      </button>
                                      <button 
                                        className="comment-reply-action-btn"
                                        onClick={() => {
                                          setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                                          setReplyInputs({ ...replyInputs, [comment.id]: '' });
                                        }}
                                      >
                                        رد
                                      </button>

                                      {currentUser && currentUser.id === comment.user.id && (
                                        <button 
                                          className="comment-delete-action-btn"
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                        >
                                          حذف
                                        </button>
                                      )}
                                    </div>

                                    {/* Reply Input */}
                                    {activeReplyId === comment.id && currentUser && (
                                      <div className="new-reply-input-row">
                                        <div 
                                          className="user-avatar-circle size-xs" 
                                          style={{ backgroundColor: getAvatarColor(currentUser) }}
                                        >
                                          {currentUser.avatar ? (
                                             <img src={`${BACKEND_URL}${currentUser.avatar}`} alt={currentUser.name} />
                                          ) : (
                                            getUserInitials(currentUser.name)
                                          )}
                                        </div>
                                        <div className="comment-text-input-field">
                                          <input 
                                            type="text"
                                            placeholder={`رد على ${comment.user.name}...`}
                                            value={replyInputs[comment.id] || ''}
                                            onChange={(e) => setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleAddComment(post.id, comment.id);
                                            }}
                                            autoFocus
                                          />
                                          <button 
                                            className="comment-submit-icon-btn"
                                            onClick={() => handleAddComment(post.id, comment.id)}
                                            disabled={!replyInputs[comment.id]?.trim()}
                                          >
                                            <Send size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Replies Nested */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="comment-replies-nested-list">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="nested-reply-item">
                                        <div 
                                          className="user-avatar-circle size-xs" 
                                          style={{ backgroundColor: getAvatarColor(reply.user), cursor: 'pointer' }}
                                          onClick={() => navigate('/profile/' + reply.user.id)}
                                        >
                                          {reply.user.avatar ? (
                                             <img src={`${BACKEND_URL}${reply.user.avatar}`} alt={reply.user.name} />
                                          ) : (
                                            getUserInitials(reply.user.name)
                                          )}
                                        </div>
                                        <div className="comment-text-wrapper">
                                          <div className="commenter-meta-row">
                                            <span 
                                              className="commenter-name-text"
                                              onClick={() => navigate('/profile/' + reply.user.id)}
                                            >
                                              {reply.user.name}
                                            </span>
                                            {reply.user.role === 'lawyer' && (
                                              <span className="lawyer-badge-small">محامي معتمد</span>
                                            )}
                                            <span className="comment-time-text">{formatTimeAgo(reply.created_at)}</span>
                                          </div>
                                          <p className="comment-body-content">{reply.content}</p>
                                          
                                          <div className="comment-card-actions">
                                            <button 
                                              className={`comment-thumb-btn ${reply.user_liked === true ? 'liked' : ''}`}
                                              onClick={() => handleCommentVote(post.id, reply.id, true, comment.id)}
                                            >
                                              <ThumbsUp size={11} />
                                              <span>{reply.likes_count}</span>
                                            </button>
                                            <button 
                                              className={`comment-thumb-btn ${reply.user_liked === false ? 'disliked' : ''}`}
                                              onClick={() => handleCommentVote(post.id, reply.id, false, comment.id)}
                                            >
                                              <ThumbsDown size={11} />
                                              <span>{reply.dislikes_count}</span>
                                            </button>
                                            
                                            {currentUser && currentUser.id === reply.user.id && (
                                              <button 
                                                className="comment-delete-action-btn"
                                                onClick={() => handleDeleteComment(post.id, reply.id, comment.id)}
                                              >
                                                حذف
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              </div>
                            ))
                          ) : (
                            <div className="no-comments-yet-label">
                              <p>لا توجد تعليقات بعد.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-feed-card animate-fade-in">
              <MessageSquare size={48} className="empty-feed-icon" />
              <h3>لا توجد منشورات</h3>
              <p>كن أول من يشارك سؤالاً في المجتمع القانوني!</p>
            </div>
          )}

        </div>



      </div>

      {/* ========== SAVE TO COLLECTION MODAL ========== */}
      {showSaveModal && (
        <div className="save-modal-overlay" onClick={() => { setShowSaveModal(false); setSaveModalPostId(null); }}>
          <div className="save-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="save-modal-header">
              <h3><Bookmark size={20} /> حفظ المنشور</h3>
              <button className="save-modal-close" onClick={() => { setShowSaveModal(false); setSaveModalPostId(null); }}>
                <X size={20} />
              </button>
            </div>

            <div className="save-modal-body">
              {/* Save without collection */}
              <button 
                className="save-collection-item save-no-collection"
                onClick={() => savePostToCollection(null)}
                disabled={savingPost}
              >
                <div className="collection-item-icon">
                  <Bookmark size={22} />
                </div>
                <div className="collection-item-info">
                  <span className="collection-item-name">حفظ بدون مجموعة</span>
                  <span className="collection-item-sub">حفظ سريع</span>
                </div>
                <ChevronLeft size={16} className="collection-arrow" />
              </button>

              {/* Existing collections */}
              {collections.length > 0 && (
                <div className="save-collections-list">
                  <p className="collections-section-title">المجموعات</p>
                  {collections.map(col => (
                    <button 
                      key={col.id}
                      className="save-collection-item"
                      onClick={() => savePostToCollection(col.id)}
                      disabled={savingPost}
                    >
                      <div className="collection-item-icon collection-folder">
                        <FolderPlus size={22} />
                      </div>
                      <div className="collection-item-info">
                        <span className="collection-item-name">{col.name}</span>
                        <span className="collection-item-sub">{col.saved_posts_count || 0} منشور</span>
                      </div>
                      <ChevronLeft size={16} className="collection-arrow" />
                    </button>
                  ))}
                </div>
              )}

              {/* Create new collection */}
              <div className="save-new-collection-section">
                <p className="collections-section-title">مجموعة جديدة</p>
                <div className="new-collection-input-row">
                  <input 
                    type="text"
                    placeholder="اسم المجموعة..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollectionAndSave()}
                    className="new-collection-input"
                    maxLength={100}
                  />
                  <button 
                    className="new-collection-save-btn"
                    onClick={handleCreateCollectionAndSave}
                    disabled={!newCollectionName.trim() || creatingCollection}
                  >
                    {creatingCollection ? '...' : <><Check size={16} /> حفظ</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Community;
