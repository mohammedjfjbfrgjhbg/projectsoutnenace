import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import "./ChatBox.css"
import api from "../../services/api"
import { useLanguage } from "../../context/LanguageContext"

const ChatBox = forwardRef((props, ref) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const formatTime = (date) => {
    if (!date) return ""
    return date.toLocaleTimeString("ar-MA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  }

  const sendMessage = async (textFromButton) => {
    const message = textFromButton || input
    if (message.trim() === "") return

    setMessages(prev => [...prev, { text: message, type: "user", time: new Date() }])
    setInput("")

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    setLoading(true)

    try {
      const response = await api.post("/ai/ask", { 
        question: message,
        category: "عام"
      });

      setMessages(prev => [...prev, { text: response.data.answer, type: "ai", time: new Date() }])

    } catch (err) {
      console.error("AI Ask error:", err);
      let errMsg = t('chatErrorServer');
      
      if (err.response && err.response.status === 403) {
        errMsg = t('chatErrorPremium');
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }

      setMessages(prev => [
        ...prev,
        { text: errMsg, type: "ai", time: new Date() }
      ])

    } finally {
      setLoading(false)
    }
  }

  useImperativeHandle(ref, () => ({
    sendMessage
  }))

  const suggestions = [
    t('chatSuggestion1') || "كيفاش نكتب إشعار؟",
    t('chatSuggestion2') || "شنو هي مدة الإخطار؟",
    t('categoryCompanies') || "الشركات",
    t('employmentContractTitle') || "عقد العمل"
  ];
  
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="chat-container" dir={dir}>
      <div className="chat-messages">
        {messages.map((msg, i) =>
          msg.type === "user" ? (
            <div key={i} className="message-wrapper user">
              <div className="message-bubble">
                {msg.text}
              </div>
              <div className="user-avatar">ر</div>
            </div>
          ) : (
            <div key={i} className="message-wrapper ai">
              <div className="ai-avatar-circle">
                <span className="ai-icon">⚖️</span>
              </div>
              <div className="message-bubble">
                <div className="ai-intro">
                  {t('chatWelcomeTitle')}
                </div>
                <div className="ai-body">
                  {msg.text}
                </div>
                <span className="msg-time">{formatTime(msg.time)}</span>
              </div>
            </div>
          )
        )}

        {/* Initial message if empty */}
        {messages.length === 0 && (
          <div className="message-wrapper ai">
            <div className="ai-avatar-circle">
              <span className="ai-icon">⚖️</span>
            </div>
            <div className="message-bubble">
              <div className="ai-intro">
                {t('chatWelcomeTitle')}
              </div>
              <div className="ai-body">
                {t('chatWelcomeBody')}
              </div>
              <span className="msg-time">{t('timeNow')}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="message-wrapper ai">
            <div className="ai-avatar-circle">
              <span className="ai-icon">⚖️</span>
            </div>
            <div className="message-bubble typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-section">
        <div className="input-outer-box">
          <div className="suggestions-bar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="input-inner-box">
            <button
              className="send-button"
              onClick={() => sendMessage()}
            >
              <span className="send-arrow">←</span>
            </button>
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={t('askPlaceholder')}
              dir={dir}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default ChatBox;