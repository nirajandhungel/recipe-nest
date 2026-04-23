import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCheck, MessageCircle, SendHorizonal } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../api/chatApi';
import { connectChatSocket, disconnectChatSocket, getChatSocket } from '../../lib/chatSocket';
import { tokenStorage } from '../../utils/tokenStorage';
import { getInitials, getUserProfileImage, timeAgo } from '../../utils/helpers';

const statusTick = (status) => {
  if (status === 'seen') return <CheckCheck className="w-3.5 h-3.5 text-sky-500" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-surface-400" />;
  return <Check className="w-3.5 h-3.5 text-surface-400" />;
};

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

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === conversationId) || null,
    [conversations, conversationId]
  );

  const activeUser = activeConversation?.otherUser;

  useEffect(() => {
    let mounted = true;
    const loadConversations = async () => {
      setLoadingConversations(true);
      try {
        const { data } = await chatApi.getConversations();
        const list = data.data?.conversations || [];
        if (!mounted) return;
        setConversations(list);
        if (!conversationId && list[0]?._id) {
          navigate(`/inbox/${list[0]._id}`, { replace: true });
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load conversations');
      } finally {
        if (mounted) setLoadingConversations(false);
      }
    };
    loadConversations();
    return () => {
      mounted = false;
    };
  }, [conversationId, navigate]);

  useEffect(() => {
    if (!conversationId) return;
    let mounted = true;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await chatApi.getMessages(conversationId, { limit: 50 });
        if (!mounted) return;
        setMessages(data.data?.messages || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load messages');
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    };
    loadMessages();

    return () => {
      mounted = false;
    };
  }, [conversationId]);

  useEffect(() => {
    const token = tokenStorage.get();
    const socket = connectChatSocket(token);
    if (!socket) return undefined;

    const handleMessage = ({ conversationId: incomingConversationId, message }) => {
      setConversations((prev) =>
        prev
          .map((conversation) => {
            if (conversation._id !== incomingConversationId) return conversation;
            const incomingFromOther = message.senderId?._id !== user?._id;
            const nextUnreadCount =
              conversationId === incomingConversationId || !incomingFromOther
                ? 0
                : (conversation.unreadCount || 0) + 1;
            return {
              ...conversation,
              lastMessage: {
                text: message.text,
                senderId: message.senderId?._id,
                createdAt: message.createdAt,
                status: message.status,
              },
              unreadCount: nextUnreadCount,
            };
          })
          .sort((a, b) => new Date(b.updatedAt || b.lastMessage?.createdAt || 0) - new Date(a.updatedAt || a.lastMessage?.createdAt || 0))
      );

      if (incomingConversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleConversationUpdate = ({ conversationId: updateConversationId, lastMessage, unreadCount }) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === updateConversationId
            ? {
                ...conversation,
                lastMessage: lastMessage || conversation.lastMessage,
                unreadCount: unreadCount ?? conversation.unreadCount,
              }
            : conversation
        )
      );
      if (updateConversationId === conversationId && typeof unreadCount === 'number') {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === updateConversationId ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
      }
    };

    const handlePresenceUpdate = ({ userId, online }) => {
      setPresence((prev) => ({ ...prev, [userId]: online }));
    };

    const handleSeen = ({ conversationId: seenConversationId }) => {
      if (seenConversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.senderId?._id === user?._id ? { ...message, status: 'seen', seenAt: new Date().toISOString() } : message
        )
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
  }, [conversationId, user?._id]);

  useEffect(() => {
    const socket = getChatSocket();
    if (conversationId && socket) {
      socket.emit('chat:seen', { conversationId });
      setConversations((prev) =>
        prev.map((conversation) => (conversation._id === conversationId ? { ...conversation, unreadCount: 0 } : conversation))
      );
    }
  }, [conversationId]);

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
  };

  return (
    <div className="h-[calc(100vh-11rem)] sm:h-[calc(100vh-13rem)] card overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col md:grid md:grid-cols-[320px_1fr]">
      <aside className={`border-r border-surface-200 dark:border-surface-800 h-full ${conversationId ? 'hidden md:flex' : 'flex'} flex-col min-w-0`}>
          <div className="p-4 border-b border-surface-100 dark:border-surface-800">
            <h1 className="font-display text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brand-500" />
              Inbox
            </h1>
          </div>
          <div className="overflow-y-auto h-[calc(100%-70px)]">
            {loadingConversations ? (
              <p className="p-4 text-sm text-surface-400">Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-surface-400">No chats yet. Start from a user profile.</p>
            ) : (
              conversations.map((conversation) => {
                const peer = conversation.otherUser;
                const avatar = getUserProfileImage(peer);
                const selected = conversation._id === conversationId;
                return (
                  <Link
                    key={conversation._id}
                    to={`/inbox/${conversation._id}`}
                    className={`flex items-center gap-3 p-3 border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors ${
                      selected ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                    }`}
                  >
                    <div className="relative">
                      {avatar ? (
                        <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                          {getInitials(peer?.firstName, peer?.lastName)}
                        </div>
                      )}
                      {presence[peer?._id] && <span className="absolute -right-0.5 bottom-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-surface-900" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">
                          {peer?.firstName} {peer?.lastName}
                        </p>
                        <span className="text-[11px] text-surface-400">{timeAgo(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-surface-500 truncate">
                          {conversation.lastMessage?.text || 'Start chatting'}
                        </p>
                        {!!conversation.unreadCount && (
                          <span className="min-w-5 h-5 px-1 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <section className={`${conversationId ? 'flex' : 'hidden md:flex'} flex-col h-full`}>
          {activeConversation ? (
            <>
              <div className="p-3 border-b border-surface-200 dark:border-surface-800 flex items-center gap-3">
                <Link to="/inbox" className="md:hidden text-sm text-brand-600">Back</Link>
                {getUserProfileImage(activeUser) ? (
                  <img src={getUserProfileImage(activeUser)} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                    {getInitials(activeUser?.firstName, activeUser?.lastName)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {activeUser?.firstName} {activeUser?.lastName}
                  </p>
                  <p className="text-xs text-surface-400">{presence[activeUser?._id] ? 'Online' : 'Offline'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-50 dark:bg-surface-950">
                {loadingMessages ? (
                  <p className="text-sm text-surface-400">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-surface-400 text-center mt-6">No messages yet.</p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId?._id === user?._id;
                    return (
                      <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                            mine
                              ? 'bg-brand-500 text-white rounded-br-md'
                              : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-bl-md'
                          }`}
                        >
                          <p>{message.text}</p>
                          <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? 'text-white/80 justify-end' : 'text-surface-400'}`}>
                            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {mine && statusTick(message.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-surface-200 dark:border-surface-800 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendMessage();
                  }}
                  className="input-base flex-1"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center"
                >
                  <SendHorizonal className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="hidden md:flex h-full items-center justify-center text-surface-400">
              Select a conversation to start chatting.
            </div>
          )}
        </section>
    </div>
  );
};

export default Inbox;
