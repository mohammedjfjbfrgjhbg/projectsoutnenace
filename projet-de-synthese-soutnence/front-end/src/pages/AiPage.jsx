import { useRef } from "react"
import HeroSection from "../components/Hero/HeroSection"

import "./AiPage.css"
import ChatBox from "../components/Chat/ChatBox"

function AiPage() {
  const chatRef = useRef()

  const handleAsk = (question) => {
    chatRef.current?.sendMessage(question)
  }

  return (
    <div className="ai-page-wrapper">
      <HeroSection onAsk={handleAsk} chatRef={chatRef} />
      <div className="chat-content-area">
        <ChatBox ref={chatRef} />
      </div>
    </div>
  )
}

export default AiPage