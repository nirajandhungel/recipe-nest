import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCheck, MessageCircle, SendHorizonal, Search, ArrowLeft, Smile, Phone, Video, MoreVertical, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../api/chatApi';
import { connectChatSocket, disconnectChatSocket, getChatSocket } from '../../lib/chatSocket';
import { tokenStorage } from '../../utils/tokenStorage';
import { getInitials, getUserProfileImage, timeAgo } from '../../utils/helpers';

/* ── Tick indicators (WhatsApp-style) ── */
const StatusTick = ({ status, mine }) => {
  if (!mine) return null;

  if (status === 'seen') {
    return (
      <span className="inline-flex items-center tick-seen" title="Seen">
        <CheckCheck className="w-4 h-4 text-blue-400" />
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center" title="Delivered">
        <CheckCheck className="w-4 h-4 text-surface-400/70" />
      </span>
    );
  }
  // sent (single tick)
  return (
    <span className="inline-flex items-center" title="Sent">
      <Check className="w-4 h-4 text-surface-400/70" />
    </span>
  );
};

/* ── Date separator ── */
const DateSeparator = ({ date }) => {
  const today = new Date();
  const msgDate = new Date(date);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label;
  if (msgDate.toDateString() === today.toDateString()) {
    label = 'Today';
  } else if (msgDate.toDateString() === yesterday.toDateString()) {
    label = 'Yesterday';
  } else {
    label = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="flex items-center justify-center my-5">
      <span className="px-4 py-1.5 rounded-lg bg-white/90 dark:bg-surface-800/90 text-[11px] font-semibold text-surface-500 dark:text-surface-400 shadow-sm backdrop-blur-sm border border-surface-200/40 dark:border-surface-700/40">
        {label}
      </span>
    </div>
  );
};

/* ── Conversation list item ── */
const ConversationItem = ({ conversation, selected, presence, currentUserId }) => {
  const peer = conversation.otherUser;
  const avatar = getUserProfileImage(peer);
  const isOnline = presence[peer?._id];
  const lastMsg = conversation.lastMessage;
  const isMine = lastMsg?.senderId === currentUserId || lastMsg?.senderId?._id === currentUserId;

  return (
    <Link
      to={`/inbox/${conversation._id}`}
      className={`group flex items-center gap-3 px-4 py-3 transition-all duration-150 ${
        selected
          ? 'bg-brand-50 dark:bg-brand-900/20'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
      }`}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-bold">
            {getInitials(peer?.firstName, peer?.lastName)}
          </div>
        )}
        {isOnline && (
          <span className="absolute right-0 bottom-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-[2.5px] border-white dark:border-surface-900" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[15px] font-semibold truncate ${selected ? 'text-brand-700 dark:text-brand-300' : 'text-surface-900 dark:text-surface-100'}`}>
            {peer?.firstName} {peer?.lastName}
          </p>
          <span className={`text-[11px] flex-shrink-0 ${conversation.unreadCount ? 'text-brand-600 font-semibold' : 'text-surface-400'}`}>
            {timeAgo(lastMsg?.createdAt || conversation.updatedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* Show tick for own messages in preview */}
            {isMine && lastMsg && (
              <span className="flex-shrink-0">
                {lastMsg.status === 'seen' ? (
                  <CheckCheck className="w-4 h-4 text-blue-400" />
                ) : lastMsg.status === 'delivered' ? (
                  <CheckCheck className="w-4 h-4 text-surface-400" />
                ) : (
                  <Check className="w-4 h-4 text-surface-400" />
                )}
              </span>
            )}
            <p className={`text-[13px] truncate ${conversation.unreadCount ? 'text-surface-800 dark:text-surface-200 font-medium' : 'text-surface-500 dark:text-surface-400'}`}>
              {lastMsg?.text || 'Start chatting'}
            </p>
          </div>
          {!!conversation.unreadCount && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ═══════════════ INBOX COMPONENT ═══════════════ */
const Inbox = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [presence, setPresence] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === conversationId) || null,
    [conversations, conversationId]
  );
  const activeUser = activeConversation?.otherUser;

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const peer = c.otherUser;
      const name = `${peer?.firstName || ''} ${peer?.lastName || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [conversations, searchQuery]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Load conversations
  useEffect(() => {
    let mounted = true;
    const loadConversations = async () => {
      setLoadingConversations(true);
      try {
        const { data } = await chatApi.getConversations();
        const list = data.data?.conversations || [];
        if (!mounted) return;
        setConversations(list);
        if (!conversationId && list[0]?._id && window.innerWidth >= 768) {
          navigate(`/inbox/${list[0]._id}`, { replace: true });
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load conversations');
      } finally {
        if (mounted) setLoadingConversations(false);
      }
    };
    loadConversations();
    return () => { mounted = false; };
  }, [conversationId, navigate]);

  // Load messages for active conversation
  useEffect(() => {
    if (!conversationId) return;
    let mounted = true;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await chatApi.getMessages(conversationId, { limit: 50 });
        if (!mounted) return;
        setMessages(data.data?.messages || []);
        // Scroll to bottom instantly on load
        setTimeout(() => scrollToBottom('auto'), 100);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load messages');
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    };
    loadMessages();
    return () => { mounted = false; };
  }, [conversationId, scrollToBottom]);

  // Socket event listeners
  useEffect(() => {
    const token = tokenStorage.get();
    const socket = connectChatSocket(token);
    if (!socket) return undefined;

    const handleMessage = ({ conversationId: incomingCid, message }) => {
      setConversations((prev) =>
        prev
          .map((c) => {
            if (c._id !== incomingCid) return c;
            const incomingFromOther = message.senderId?._id !== user?._id;
            const nextUnreadCount =
              conversationId === incomingCid || !incomingFromOther
                ? 0
                : (c.unreadCount || 0) + 1;
            return {
              ...c,
              lastMessage: {
                text: message.text,
                senderId: message.senderId?._id,
                createdAt: message.createdAt,
                status: message.status,
              },
              unreadCount: nextUnreadCount,
              updatedAt: message.createdAt,
            };
          })
          .sort((a, b) => new Date(b.updatedAt || b.lastMessage?.createdAt || 0) - new Date(a.updatedAt || a.lastMessage?.createdAt || 0))
      );

      if (incomingCid === conversationId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => scrollToBottom('smooth'), 50);

        const isFromOther = message.senderId?._id !== user?._id;
        if (isFromOther) {
          socket.emit('chat:seen', { conversationId: incomingCid });
        }
      }
    };

    const handleConversationUpdate = ({ conversationId: updateCid, lastMessage, unreadCount }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== updateCid) return c;
          const updatedConvo = {
            ...c,
            lastMessage: lastMessage || c.lastMessage,
          };
          if (updateCid === conversationId) {
            updatedConvo.unreadCount = 0;
          } else {
            updatedConvo.unreadCount = unreadCount ?? c.unreadCount;
          }
          return updatedConvo;
        })
      );
    };

    const handlePresenceUpdate = ({ userId, online }) => {
      setPresence((prev) => ({ ...prev, [userId]: online }));
    };

    const handleSeen = ({ conversationId: seenCid, seenAt }) => {
      if (seenCid === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => {
            const isMine = msg.senderId?._id === user?._id;
            if (isMine && msg.status !== 'seen') {
              return { ...msg, status: 'seen', seenAt: seenAt || new Date().toISOString() };
            }
            return msg;
          })
        );
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== seenCid) return c;
          if (c.lastMessage?.senderId === user?._id) {
            return {
              ...c,
              lastMessage: { ...c.lastMessage, status: 'seen' },
            };
          }
          return c;
        })
      );
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:conversation:update', handleConversationUpdate);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('chat:seen', handleSeen);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:conversation:update', handleConversationUpdate);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('chat:seen', handleSeen);
    };
  }, [conversationId, user?._id, scrollToBottom]);

  // Emit chat:seen when entering a conversation
  useEffect(() => {
    const socket = getChatSocket();
    if (conversationId && socket) {
      socket.emit('chat:seen', { conversationId });
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    }
  }, [conversationId]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversationId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversationId]);

  // Cleanup socket on unmount
  useEffect(() => () => disconnectChatSocket(), []);

  const sendMessage = () => {
    const clean = draft.trim();
    const socket = getChatSocket();
    if (!clean || !conversationId || !socket) return;

    socket.emit('chat:send', { conversationId, text: clean }, (ack) => {
      if (!ack?.ok) {
        toast.error(ack?.message || 'Failed to send');
      }
    });
    setDraft('');
    inputRef.current?.focus();
  };

  // Group messages by date for separators
  const messagesWithDates = useMemo(() => {
    const result = [];
    let lastDate = '';
    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        result.push({ type: 'date', date: msg.createdAt, id: `date-${msgDate}` });
        lastDate = msgDate;
      }
      result.push({ type: 'message', ...msg, id: msg._id });
    });
    return result;
  }, [messages]);

  const activeUserAvatar = getUserProfileImage(activeUser);
  const isActiveOnline = presence[activeUser?._id];

  return (
    <div className="inbox-container flex flex-col md:grid md:grid-cols-[360px_1fr]">

      {/* ═══════ LEFT: CONVERSATION LIST ═══════ */}
      <aside className={`border-r border-surface-200 dark:border-surface-800 h-full ${conversationId ? 'hidden md:flex' : 'flex'} flex-col min-w-0 bg-white dark:bg-surface-900`}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-xl font-bold text-surface-900 dark:text-white">Chats</h1>
            <div className="flex items-center gap-1">
              <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-full font-medium">
                {conversations.length}
              </span>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-surface-700 transition-all placeholder-surface-400 border-0"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="overflow-y-auto flex-1">
          {loadingConversations ? (
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-surface-400">Loading chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-7 h-7 text-surface-300" />
              </div>
              <p className="text-sm text-surface-500 font-medium">
                {searchQuery ? 'No matches found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                {searchQuery ? 'Try a different search' : 'Start a chat from a chef profile'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                selected={conversation._id === conversationId}
                presence={presence}
                currentUserId={user?._id}
              />
            ))
          )}
        </div>
      </aside>

      {/* ═══════ RIGHT: MESSAGE THREAD ═══════ */}
      <section className={`${conversationId ? 'flex' : 'hidden md:flex'} flex-col h-full bg-[#efeae2] dark:bg-surface-950 relative`}>
        {/* Chat wallpaper pattern */}
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {activeConversation ? (
          <>
            {/* Chat header */}
            <div className="relative z-10 px-3 sm:px-4 py-2.5 flex items-center gap-3 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex-shrink-0">
              <Link to="/inbox" className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <ArrowLeft className="w-5 h-5 text-surface-600" />
              </Link>

              <Link to={`/profile/${activeUser?._id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                <div className="relative flex-shrink-0">
                  {activeUserAvatar ? (
                    <img src={activeUserAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-bold">
                      {getInitials(activeUser?.firstName, activeUser?.lastName)}
                    </div>
                  )}
                  {isActiveOnline && (
                    <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-surface-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate group-hover:text-brand-600 transition-colors">
                    {activeUser?.firstName} {activeUser?.lastName}
                  </p>
                  <p className={`text-xs font-medium ${isActiveOnline ? 'text-emerald-500' : 'text-surface-400'}`}>
                    {isActiveOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </Link>

              {activeUser && (
                <Link
                  to={`/profile/${activeUser?._id}`}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors hidden sm:inline-flex"
                >
                  View Profile
                </Link>
              )}
            </div>

            {/* Messages area */}
            <div ref={messagesContainerRef} className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-6 py-3" id="messages-container">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-surface-500">Loading messages...</p>
                  </div>
                </div>
              ) : messagesWithDates.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/80 dark:bg-surface-800/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Smile className="w-9 h-9 text-brand-400" />
                    </div>
                    <p className="text-sm text-surface-600 font-medium">No messages yet</p>
                    <p className="text-xs text-surface-400 mt-1">Say hello to start the conversation!</p>
                  </div>
                </div>
              ) : (
                <>
                  {messagesWithDates.map((item) => {
                    if (item.type === 'date') {
                      return <DateSeparator key={item.id} date={item.date} />;
                    }

                    const mine = item.senderId?._id === user?._id;
                    return (
                      <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-1 message-appear`}>
                        <div
                          className={`relative max-w-[80%] sm:max-w-[65%] px-3 py-2 text-[14.5px] leading-relaxed ${
                            mine
                              ? 'bg-[#d9fdd3] dark:bg-brand-900 text-surface-900 dark:text-surface-100 rounded-lg rounded-tr-none'
                              : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-lg rounded-tl-none shadow-sm'
                          }`}
                        >
                          {/* Message bubble tail */}
                          <div className={`absolute top-0 w-3 h-3 ${
                            mine
                              ? '-right-1.5 text-[#d9fdd3] dark:text-brand-900'
                              : '-left-1.5 text-white dark:text-surface-800'
                          }`}>
                            <svg viewBox="0 0 8 13" className={`w-3 h-3 fill-current ${mine ? '' : 'scale-x-[-1]'}`}>
                              <path d="M5.188,1H0V0H5.188C3.468,4.8,0,7.076,0,7.076v3.937C3.458,8.217,6.781,3.819,7.855,1.937A1.12,1.12,0,0,0,7.07,0.252,1.141,1.141,0,0,0,5.188,1Z" />
                            </svg>
                          </div>

                          <p className="whitespace-pre-wrap break-words">{item.text}</p>
                          <div className={`flex items-center gap-1 mt-0.5 ${mine ? 'justify-end' : ''}`}>
                            <span className={`text-[10.5px] leading-none ${mine ? 'text-surface-500 dark:text-surface-400' : 'text-surface-400'}`}>
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <StatusTick status={item.status} mine={mine} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            <div className="relative z-10 px-3 sm:px-4 py-2.5 bg-white/95 dark:bg-surface-900/95 backdrop-blur border-t border-surface-200/60 dark:border-surface-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-full px-4 py-1 border border-surface-200 dark:border-surface-700 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 py-2 bg-transparent text-sm focus:outline-none placeholder-surface-400"
                    placeholder="Type a message"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim()}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    draft.trim()
                      ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95'
                      : 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                  }`}
                >
                  <SendHorizonal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex h-full items-center justify-center relative z-10">
            <div className="text-center">
              <div className="w-28 h-28 rounded-full bg-white/70 dark:bg-surface-800/70 flex items-center justify-center mx-auto mb-5 shadow-sm backdrop-blur-sm">
                <MessageCircle className="w-14 h-14 text-surface-300 dark:text-surface-600" />
              </div>
              <h3 className="text-xl font-display font-bold text-surface-700 dark:text-surface-300">RecipeNest Chat</h3>
              <p className="text-sm text-surface-400 mt-2 max-w-xs mx-auto leading-relaxed">
                Send and receive messages with chefs and food lovers. Select a conversation to start chatting.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Inbox;
