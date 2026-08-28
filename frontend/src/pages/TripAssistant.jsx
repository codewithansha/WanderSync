import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTrip, sendChatMessage, sendChatWithImage, uploadPdfDocument, translateText, optimizeText } from '../services/api';
import TripSubNav from '../components/TripSubNav';
import { 
  Bot, User, Send, Sparkles, Image, FileText, 
  Trash2, Pin, Plus, Search, Copy, Check, 
  AlertCircle, X, ExternalLink, HelpCircle, RefreshCw, Mic,
  Languages
} from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

export default function TripAssistant() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(true);

  // Load trip data
  useEffect(() => {
    if (tripId) {
      setLoadingTrip(true);
      fetchTrip(tripId)
        .then(data => {
          setTrip(data);
        })
        .finally(() => setLoadingTrip(false));
    }
  }, [tripId]);

  const destName = trip?.trip?.destination_short || trip?.destination || 'your destination';

  const QUICK_PROMPTS = [
    `How much budget is remaining?`,
    `Find a better dinner option for Day 1`,
    `Make Day 2 cheaper`,
    `What should I pack for ${destName}?`,
    `What is the best way to get around in ${destName}?`,
    `Suggest indoor backup activities if it rains`
  ];

  // Multi-session chat state
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem(`wandersync_chats_${tripId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const initId = `trip_session_${Date.now()}`;
    return {
      [initId]: [
        {
          id: 'welcome',
          role: 'ai',
          text: `Hello! I am your **WanderSync AI Travel Maestro**, powered by Google Gemini.\n\nI have live context of your itinerary, scheduled stops, budget breakdown, and local tips for **${destName}**.\n\nHow can I refine or assist your journey today? You can ask me to adjust days, analyze remaining budget, or upload travel vouchers!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    return Object.keys(chats)[0] || `trip_session_${Date.now()}`;
  });

  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      const saved = localStorage.getItem(`wandersync_pinned_${tripId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Tools panel state
  const [activeTool, setActiveTool] = useState(null);
  const [toolText, setToolText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [optimizeStyle, setOptimizeStyle] = useState('improve_writing');
  const [toolResult, setToolResult] = useState(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [toolCopied, setToolCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const {
    isListening, isSupported: voiceSupported, error: voiceError,
    startListening, stopListening, clearError: clearVoiceError
  } = useSpeechRecognition();

  const handleVoiceChat = () => {
    if (isListening) { stopListening(); return; }
    startListening((text) => setInput(prev => prev ? prev + ' ' + text : text));
  };

  const LANGUAGES = [
    'English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German',
    'Chinese', 'Japanese', 'Korean', 'Hindi', 'Italian',
    'Portuguese', 'Turkish', 'Russian',
  ];

  const OPT_STYLES = [
    { id: 'improve_writing', label: '✨ Improve Writing' },
    { id: 'make_concise', label: '📝 Make Concise' },
    { id: 'professional', label: '💼 Professional' },
    { id: 'friendly', label: '😊 Friendly' },
    { id: 'clear_simple', label: '🎯 Clear & Simple' },
    { id: 'persuasive', label: '📢 Persuasive' },
    { id: 'fix_grammar', label: '✏️ Fix Grammar' },
  ];

  const openTool = (tool, text) => {
    setActiveTool(tool);
    setToolText(text || '');
    setToolResult(null);
    setToolCopied(false);
  };

  const closeTool = () => {
    setActiveTool(null);
    setToolText('');
    setToolResult(null);
    setToolCopied(false);
  };

  const handleTranslate = async () => {
    const text = toolText.trim();
    if (!text) return;
    setToolLoading(true);
    setToolResult(null);
    setErrorMessage(null);
    try {
      const data = await translateText({ text, targetLanguage });
      setToolResult({ operation: 'translate', text: data.result, language: data.target_language });
      const msg = {
        id: `msg_${Date.now()}_tool`,
        role: 'ai',
        text: `🌐 **Translation → ${data.target_language}:**\n\n${data.result}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChats(prev => ({ ...prev, [currentChatId]: [...(prev[currentChatId] || []), msg] }));
    } catch (err) {
      setErrorMessage(err.message || 'Translation is temporarily unavailable.');
    } finally {
      setToolLoading(false);
    }
  };

  const handleOptimize = async () => {
    const text = toolText.trim();
    if (!text) return;
    setToolLoading(true);
    setToolResult(null);
    setErrorMessage(null);
    try {
      const data = await optimizeText({ text, style: optimizeStyle });
      const styleLabel = OPT_STYLES.find(s => s.id === optimizeStyle)?.label || optimizeStyle;
      setToolResult({ operation: 'optimize', text: data.result, style: styleLabel });
      const msg = {
        id: `msg_${Date.now()}_tool`,
        role: 'ai',
        text: `✨ **Optimized (${styleLabel}):**\n\n${data.result}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChats(prev => ({ ...prev, [currentChatId]: [...(prev[currentChatId] || []), msg] }));
    } catch (err) {
      setErrorMessage(err.message || 'Text optimization is temporarily unavailable.');
    } finally {
      setToolLoading(false);
    }
  };

  const handleToolCopy = (text) => {
    navigator.clipboard.writeText(text);
    setToolCopied(true);
    setTimeout(() => setToolCopied(false), 2000);
  };

  const useResultInChat = (text) => {
    setInput(text);
    closeTool();
  };

  // Sync chats to localStorage
  useEffect(() => {
    if (!tripId) return;
    try {
      localStorage.setItem(`wandersync_chats_${tripId}`, JSON.stringify(chats));
    } catch (e) {}
  }, [chats, tripId]);

  useEffect(() => {
    if (!tripId) return;
    try {
      localStorage.setItem(`wandersync_pinned_${tripId}`, JSON.stringify(pinnedChats));
    } catch (e) {}
  }, [pinnedChats, tripId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId, isTyping]);

  const currentMessages = chats[currentChatId] || [];

  const handleNewChat = () => {
    const newId = `trip_session_${Date.now()}`;
    setChats(prev => ({
      ...prev,
      [newId]: [
        {
          id: 'welcome',
          role: 'ai',
          text: `New consultation started for **${destName}**. How would you like to optimize your schedule or expenses?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }));
    setCurrentChatId(newId);
  };

  const handleDeleteChat = (id, e) => {
    e.stopPropagation();
    const chatKeys = Object.keys(chats);
    if (chatKeys.length <= 1) {
      handleNewChat();
      return;
    }
    const nextChats = { ...chats };
    delete nextChats[id];
    setChats(nextChats);
    if (currentChatId === id) {
      setCurrentChatId(Object.keys(nextChats)[0]);
    }
  };

  const handlePinChat = (id, e) => {
    e.stopPropagation();
    setPinnedChats(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePdfSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setErrorMessage(null);
        const res = await uploadPdfDocument(file);
        setUploadedPdf(file.name);
        setPdfText(res.text || '');
      } catch (err) {
        setErrorMessage('Failed to extract PDF text: ' + err.message);
      }
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text.trim() && !selectedImage && !pdfText) return;

    setErrorMessage(null);
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      image: imagePreview,
      pdf: uploadedPdf,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message immediately
    setChats(prev => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []), userMsg]
    }));

    setInput('');
    if (isListening) stopListening();
    const currentImg = selectedImage;
    const currentPdfCtx = pdfText;
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedPdf(null);
    setPdfText('');
    setIsTyping(true);

    try {
      let aiResponseText = '';

      if (currentImg) {
        const res = await sendChatWithImage({
          query: text || 'Analyze this travel voucher or landmark image',
          imageFile: currentImg,
          tripId: tripId
        });
        aiResponseText = res.answer;
      } else {
        // Build history
        const hist = (chats[currentChatId] || []).map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          text: m.text
        }));

        const res = await sendChatMessage({
          query: text,
          tripId: tripId,
          history: hist,
          pdfContext: currentPdfCtx
        });
        aiResponseText = res.answer;
      }

      const aiMsg = {
        id: `msg_${Date.now()}_ai`,
        role: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), aiMsg]
      }));
    } catch (err) {
      setErrorMessage(err.message || 'AI service temporarily unavailable. Please retry.');
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      <TripSubNav tripId={trip?.trip_id || trip?.id || tripId} />

      <div className="container" style={{ marginBottom: '3rem' , marginTop: '20px', marginBottom: '20px' }}>
        {/* Header */}
        <div className="assistant-page-header">
          <div>
            <h1 className="assistant-page-title">
              <Bot size={28} color="var(--primary-blue)" /> AI Travel Maestro
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.25rem 0 0' }}>
              Real-time concierge with live context of your {destName} journey.
            </p>
          </div>
          <div className="assistant-header-actions">
            <button
              onClick={() => setMobileSidebarOpen(o => !o)}
              className="btn btn-outline btn-sm assistant-sidebar-toggle"
              title="Toggle conversation list"
            >
              <Search size={16} /> Sessions
            </button>
            <button onClick={handleNewChat} className="btn btn-outline-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> New
            </button>
          </div>
        </div>

        {/* Layout Grid: Sidebar Sessions + Main Chat Window */}
        <div className={`assistant-layout-grid${mobileSidebarOpen ? ' sidebar-open' : ''}`}>
          
          {/* Left Session Sidebar */}
          <div className="assistant-sidebar card">
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input 
                type="text"
                placeholder="Search conversations..."
                className="form-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {Object.keys(chats)
                .filter(id => {
                  if (!historySearch) return true;
                  const firstMsg = chats[id]?.[0]?.text || '';
                  return firstMsg.toLowerCase().includes(historySearch.toLowerCase());
                })
                .map(id => {
                  const isCur = id === currentChatId;
                  const isPin = pinnedChats.includes(id);
                  const firstMsg = chats[id]?.find(m => m.role === 'user')?.text || chats[id]?.[0]?.text || 'New Conversation';
                  
                  return (
                    <div 
                      key={id}
                      onClick={() => setCurrentChatId(id)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isCur ? '#EFF6FF' : 'transparent',
                        border: isCur ? '1px solid var(--primary-blue)' : '1px solid transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        color: isCur ? 'var(--primary-blue)' : 'var(--dark-navy)',
                        fontWeight: isCur ? 700 : 500
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px', display: 'flex', alignItems: 'center' }}>
                        {isPin && <Pin size={11} color="var(--primary-blue)" style={{ marginRight: 4, flexShrink: 0 }} />}
                        {firstMsg}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button 
                          onClick={(e) => handlePinChat(id, e)} 
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: isPin ? 'var(--primary-blue)' : 'var(--text-muted)' }}
                        >
                          <Pin size={12} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteChat(id, e)} 
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Main Chat Panel */}
          <div className="assistant-chat-panel card">
            
            {/* Quick Prompts Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="btn btn-outline btn-sm"
                  style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', borderRadius: '16px', padding: '0.35rem 0.75rem' }}
                >
                  <Sparkles size={12} color="var(--primary-blue)" style={{ marginRight: 4 }} />
                  {p}
                </button>
              ))}
            </div>

            {/* AI Tools Toolbar */}
            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <button
                onClick={() => openTool('translate')}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '0.78rem', borderRadius: '16px', padding: '0.35rem 0.75rem',
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  background: activeTool === 'translate' ? '#EFF6FF' : 'transparent',
                  borderColor: activeTool === 'translate' ? 'var(--primary-blue)' : undefined,
                }}
              >
                <Languages size={13} color="var(--primary-blue)" /> Translate
              </button>
              <button
                onClick={() => openTool('optimize')}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '0.78rem', borderRadius: '16px', padding: '0.35rem 0.75rem',
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  background: activeTool === 'optimize' ? '#EFF6FF' : 'transparent',
                  borderColor: activeTool === 'optimize' ? 'var(--primary-blue)' : undefined,
                }}
              >
                <Sparkles size={13} color="var(--primary-blue)" /> Optimize Text
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {currentMessages.map((msg, idx) => {
                const isAi = msg.role === 'ai';
                return (
                  <div 
                    key={msg.id || idx}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignSelf: isAi ? 'flex-start' : 'flex-end',
                      maxWidth: '85%'
                    }}
                  >
                    {isAi && (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bot size={18} />
                      </div>
                    )}

                    <div style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      background: isAi ? '#F8FAFC' : 'var(--primary-blue)',
                      color: isAi ? 'var(--dark-navy)' : 'white',
                      border: isAi ? '1px solid var(--border-color)' : 'none',
                      fontSize: '0.92rem',
                      lineHeight: '1.6',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      position: 'relative'
                    }}>
                      {/* Image attachment display */}
                      {msg.image && (
                        <img src={msg.image} alt="Attachment" style={{ maxWidth: '240px', borderRadius: '8px', marginBottom: '0.75rem' }} />
                      )}

                      {/* PDF tag display */}
                      {msg.pdf && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                          <FileText size={12} /> {msg.pdf}
                        </div>
                      )}

                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.72rem', opacity: 0.7 }}>
                        <span>{msg.timestamp}</span>
                        {isAi && (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <button 
                              onClick={() => copyToClipboard(msg.text, idx)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                              title="Copy"
                            >
                              {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <button
                              onClick={() => openTool('translate', msg.text)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3, opacity: 0.7 }}
                              title="Translate"
                            >
                              <Languages size={12} />
                            </button>
                            <button
                              onClick={() => openTool('optimize', msg.text)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3, opacity: 0.7 }}
                              title="Optimize"
                            >
                              <Sparkles size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isAi && (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: user?.profile_image ? '#F1F5F9' : 'var(--dark-navy)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        border: user?.profile_image ? '1.5px solid var(--primary-blue)' : 'none'
                      }}>
                        {user?.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.name || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={18} />
                  </div>
                  <div style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                      {toolLoading
                        ? (activeTool === 'translate' ? 'Translating...' : 'Optimizing text...')
                        : 'Consulting Gemini AI & Journey Context...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div style={{ padding: '0.5rem 1rem', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>
              </div>
            )}

            {/* Upload previews */}
            {(imagePreview || uploadedPdf) && (
              <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', alignItems: 'center' }}>
                {imagePreview && (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
                    <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: 'white', borderRadius: '50%', border: 'none', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                  </div>
                )}
                {uploadedPdf && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EFF6FF', padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', color: 'var(--primary-blue)' }}>
                    <FileText size={14} /> {uploadedPdf}
                    <button onClick={() => { setUploadedPdf(null); setPdfText(''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}><X size={12} /></button>
                  </div>
                )}
              </div>
            )}

            {/* Translate / Optimize Tools Panel */}
            {activeTool && (
              <div style={{
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '0.75rem',
                animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--dark-navy)' }}>
                    {activeTool === 'translate'
                      ? <><Languages size={18} color="var(--primary-blue)" /> Language Translation</>
                      : <><Sparkles size={18} color="var(--primary-blue)" /> Text Optimization</>
                    }
                  </div>
                  <button onClick={closeTool} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>

                {toolResult && (
                  <div style={{
                    background: 'white', borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                    border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{
                      fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600,
                      marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                    }}>
                      {toolResult.operation === 'translate'
                        ? <>🌐 Translation → {toolResult.language}</>
                        : <>✨ {toolResult.style}</>
                      }
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                      {toolResult.text}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleToolCopy(toolResult.text)}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                      >
                        {toolCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                      {toolResult.operation === 'optimize' && (
                        <button
                          onClick={() => useResultInChat(toolResult.text)}
                          className="btn btn-outline-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                        >
                          Use in Chat
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    {activeTool === 'translate' ? 'Target Language' : 'Optimization Style'}
                  </label>
                  {activeTool === 'translate' ? (
                    <select
                      value={targetLanguage}
                      onChange={e => setTargetLanguage(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={optimizeStyle}
                      onChange={e => setOptimizeStyle(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      {OPT_STYLES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    Text to {activeTool === 'translate' ? 'Translate' : 'Optimize'}
                  </label>
                  <textarea
                    value={toolText}
                    onChange={e => setToolText(e.target.value)}
                    placeholder="Type text here or select from a chat message above..."
                    maxLength={5000}
                    rows={4}
                    className="form-input"
                    style={{ resize: 'vertical', fontSize: '0.88rem', lineHeight: '1.5' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {toolText.length} / 5,000
                  </div>
                </div>

                <button
                  onClick={activeTool === 'translate' ? handleTranslate : handleOptimize}
                  disabled={toolLoading || !toolText.trim()}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {toolLoading
                    ? (activeTool === 'translate' ? '🌐 Translating...' : '✨ Optimizing...')
                    : (activeTool === 'translate'
                        ? <><Languages size={16} /> Translate</>
                        : <><Sparkles size={16} /> Optimize</>
                      )
                  }
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
              <input 
                type="file" 
                ref={imageInputRef} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageSelect} 
              />
              <button 
                type="button" 
                onClick={() => imageInputRef.current?.click()} 
                className="btn btn-outline" 
                style={{ padding: '0.7rem', borderRadius: '10px' }}
                title="Attach Travel Photo or Voucher"
              >
                <Image size={18} />
              </button>

              <input 
                type="file" 
                ref={pdfInputRef} 
                accept="application/pdf" 
                style={{ display: 'none' }} 
                onChange={handlePdfSelect} 
              />
              <button 
                type="button" 
                onClick={() => pdfInputRef.current?.click()} 
                className="btn btn-outline" 
                style={{ padding: '0.7rem', borderRadius: '10px' }}
                title="Upload Flight or Hotel PDF"
              >
                <FileText size={18} />
              </button>

              <input 
                type="text" 
                className="form-input" 
                placeholder={`Ask anything about ${destName} or your schedule...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '10px' }}
              />

              {voiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceChat}
                  onMouseEnter={() => voiceError && clearVoiceError()}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  style={{
                    background: 'none',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    padding: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isListening ? '#ef4444' : 'var(--text-muted)',
                    transition: 'color 0.2s, border-color 0.2s',
                    borderColor: isListening ? '#ef4444' : 'var(--border-color)',
                  }}
                >
                  <Mic size={18} style={isListening ? { animation: 'voice-pulse 1.2s ease-in-out infinite' } : undefined} />
                </button>
              )}

              <button 
                type="submit" 
                disabled={isTyping || (!input.trim() && !selectedImage && !pdfText)}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Send size={16} /> Send
              </button>
            </form>

            {voiceSupported && isListening && (
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-blue)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'voice-pulse 1.2s ease-in-out infinite' }} />
                Listening... speak your message
              </div>
            )}
            {voiceSupported && voiceError && (
              <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.5rem' }}>{voiceError}</div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
