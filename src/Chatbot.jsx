import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Send, Clipboard } from "lucide-react"; // ✅ Import Send & Copy icons
import "./Chatbot.css";

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false); // ✅ Track if chat has started

  const sendMessage = async () => {
    if (input.trim() === "") return;

    if (!chatStarted) setChatStarted(true); // ✅ Hide H1 when user starts chat

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: input }
          ],
          max_tokens: 300
        },
        {
          headers: {
            "Authorization": `Bearer ${"YOUR_OPENAI_API_KEY"}`,
            "Content-Type": "application/json"
          }
        }
      );

      let botMessageText = response.data.choices[0].message.content.trim();

      // Process JSON responses
      try {
        const jsonResponse = JSON.parse(botMessageText);
        botMessageText = "```json\n" + JSON.stringify(jsonResponse, null, 2) + "\n```";
      } catch (e) {
        // Not JSON, keep as-is
      }

      // Enhance response with emojis
      botMessageText = botMessageText
        .replace(/\b(error|failed|issue|problem)\b/gi, "🚨 $1")
        .replace(/\b(success|great|awesome|perfect)\b/gi, "🎉 $1");

      const botMessage = { text: botMessageText, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [...prev, { text: "Error getting response. Try again!", sender: "bot" }]);
    }

    setLoading(false);
  };

  useEffect(() => {
    const chatbox = document.querySelector(".chatbox");
    if (chatbox) chatbox.scrollTop = chatbox.scrollHeight;
  }, [messages]);

  const adjustTextareaHeight = (element) => {
    element.style.height = "2rem"; // Reset height to shrink if needed
    element.style.height = Math.min(element.scrollHeight, 192) + "px"; // Max height: 12rem (192px)
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      sendMessage();
    }
  };

  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  };

  const renderMessage = (msg, index) => {
    if (msg.sender === "bot") {
      return (
        <div className="message-container">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              code({ inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter style={atomDark} language={match[1]} {...props}>
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {msg.text}
          </ReactMarkdown>
          <div className="copy-container">
            <button className="copy-button" onClick={() => copyToClipboard(msg.text, index)}>
              <Clipboard size={18} />
            </button>
            {copiedIndex === index && <div className="copied-text">Copied</div>}
          </div>
        </div>
      );
    }

    return <p>{msg.text}</p>;
  };

  return (
    <div className="chatbot-container">
      {/* ✅ Show H1 and H2 before chat starts */}
      {!chatStarted && (
        <div className="welcome-container">
          <h1 className="welcome-message">Hi</h1>
          <h2 className="subheading">use chat to get started</h2>
        </div>
      )}

      <div className="chatbox">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {renderMessage(msg, index)}
          </div>
        ))}
        {loading && <p className="message bot">Analyzing...</p>}
      </div>
      <div className="promptPannel">
        <div className="input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={(e) => adjustTextareaHeight(e.target)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows="1"
          />
        </div>
        <div className="sendRow">
          <button className="clearSend-button" onClick={() => { setInput(""); setMessages([]); setChatStarted(false); }} disabled={loading}>
            Clear Chat
          </button>
          <button className="clearSend-button" onClick={sendMessage} disabled={loading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;