'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Send, Bot, User, Phone, Mail, Building, LayoutList, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { format } from 'date-fns';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [useAI, setUseAI] = useState(true);
  
  const token = useAuthStore(state => state.token);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    // Initialize Socket.io
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      query: { token }
    });

    socketRef.current.on('message:new', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
      // Join socket room for this lead's conversation
      const conv = conversations.find(c => c.id === selectedConvId);
      if (conv) {
        socketRef.current?.emit('join-lead', conv.leadId);
      }
    }
  }, [selectedConvId]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !selectedConvId) {
        setSelectedConvId(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await api.get(`/conversations/${id}`);
      setMessages(res.data.messages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvId) return;

    const content = newMessage;
    setNewMessage('');
    
    try {
      if (useAI) {
        // Customer simulates sending a message and AI replies automatically
        await api.post(`/conversations/${selectedConvId}/messages`, { content, useAI: true });
      } else {
        // Agent is replying manually
        await api.post(`/conversations/${selectedConvId}/agent-reply`, { content });
      }
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const activeConv = conversations.find(c => c.id === selectedConvId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 backdrop-blur">
      {/* Sidebar: Conversation List */}
      <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/80">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`w-full text-left p-4 border-b border-slate-800/50 hover:bg-slate-800 transition-colors ${
                selectedConvId === conv.id ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-slate-200">{conv.lead.name}</span>
                {conv.messages[0] && (
                  <span className="text-xs text-slate-500">
                    {format(new Date(conv.messages[0].createdAt), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-2 truncate">
                {conv.lead.company || 'No Company'} • Score: {conv.lead.qualificationScore}
              </p>
              {conv.messages[0] && (
                <p className="text-sm text-slate-500 truncate">
                  {conv.messages[0].sender === 'AI' ? '🤖 ' : '👤 '}{conv.messages[0].content}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {activeConv.lead.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeConv.lead.temperature === 'HOT' ? 'bg-red-500/20 text-red-400' :
                    activeConv.lead.temperature === 'WARM' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {activeConv.lead.temperature}
                  </span>
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Building className="w-3 h-3"/> {activeConv.lead.company || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {activeConv.lead.phone}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setUseAI(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${useAI ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  AI Mode
                </button>
                <button 
                  onClick={() => setUseAI(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!useAI ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Manual Agent
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isCustomer = msg.sender === 'CUSTOMER';
                const isAI = msg.sender === 'AI';
                
                return (
                  <div key={msg.id || i} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`flex gap-3 max-w-[80%] ${isCustomer ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCustomer ? 'bg-slate-700 text-slate-300' :
                        isAI ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                        'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isCustomer ? <User className="w-4 h-4" /> : isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      
                      <div className={`px-4 py-3 rounded-2xl ${
                        isCustomer ? 'bg-slate-800 text-slate-200 rounded-tl-none' :
                        isAI ? 'bg-blue-600/10 border border-blue-500/20 text-blue-100 rounded-tr-none' :
                        'bg-emerald-600/10 border border-emerald-500/20 text-emerald-100 rounded-tr-none'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                        <div className={`text-[10px] mt-2 text-right ${isCustomer ? 'text-slate-500' : 'text-blue-500/50'}`}>
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={useAI ? "Simulate customer message for AI to reply..." : "Type your manual reply..."}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare className="w-12 h-12 mb-4 text-slate-700" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
