import React, { useEffect, useRef, useState } from 'react';
import { Channel, Message } from '../../types';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { PlusCircle, Smile, Hash, Pencil, Trash2, X, Check, FileImage } from 'lucide-react';
import { format } from 'date-fns';
import { getInitials, cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Props {
  channel: Channel;
}

export function ChatArea({ channel }: Props) {
  const { messages, loading, subscribeToChannel, sendMessage, deleteMessage, editMessage } = useChatStore();
  const { user } = useAuthStore();
  const { users, fetchUser } = useUserStore();
  const { setActiveProfile } = useUIStore();
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    subscribeToChannel(channel.id);
  }, [channel.id, subscribeToChannel]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    messages.forEach(msg => {
      if (!users[msg.senderId]) {
        fetchUser(msg.senderId);
      }
    });
  }, [messages, users, fetchUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB to fit in the database for this preview.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;
    
    const content = input;
    const image = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    
    if (image) {
      // For this preview we just use base64 and store it directly
      await sendMessage(content || 'Uploaded Image', 'image', image);
    } else {
      await sendMessage(content);
    }
  };
  
  const handleEditSubmit = async (messageId: string) => {
    if (!editContent.trim()) return;
    await editMessage(messageId, editContent);
    setEditingMessageId(null);
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading && <div className="text-zinc-400 text-center py-4">Loading messages...</div>}
        
        {/* Welcome Area */}
        {!loading && messages.length === 0 && (
          <div className="mt-auto mb-4">
            <div className="w-16 h-16 rounded-full bg-[#404249] flex items-center justify-center text-white mb-4">
              <Hash size={40} />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Welcome to #{channel.name}!</h1>
            <p className="text-zinc-500 dark:text-zinc-400">This is the start of the #{channel.name} channel.</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isSameUser = idx > 0 && messages[idx-1].senderId === msg.senderId;
          const showHeader = !isSameUser;
          const senderUser = users[msg.senderId];
          const displayName = senderUser?.displayName || `User ${msg.senderId.substring(0,4)}`;
          const isMe = user?.userId === msg.senderId;
          const isEditing = editingMessageId === msg.id;
          
          return (
            <div key={msg.id} className={cn("group flex gap-4 hover:bg-black/5 dark:hover:bg-[#2b2d31] -mx-4 px-4 py-0.5 mt-[1px] transition-colors relative", showHeader && "mt-4 py-1")}>
              {/* Message Actions */}
              {isMe && !isEditing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1e1f22] border border-zinc-200 dark:border-white/10 rounded-md shadow-sm hidden group-hover:flex items-center">
                  <button onClick={() => handleStartEdit(msg)} className="p-1.5 text-zinc-500 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-[#2b2d31] transition-colors rounded-l-md">
                    <Pencil size={14} />
                  </button>
                  <div className="w-px h-4 bg-zinc-200 dark:bg-white/10" />
                  <button onClick={() => deleteMessage(msg.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-[#2b2d31] transition-colors rounded-r-md">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              
              {showHeader ? (
                <div 
                  className="w-10 h-10 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer shadow-sm hover:opacity-80 transition-opacity"
                  onClick={() => setActiveProfile(msg.senderId)}
                >
                  {senderUser?.avatar ? <img src={senderUser.avatar} className="w-full h-full object-cover" /> : getInitials(displayName)}
                </div>
              ) : (
                <div className="w-10 flex-shrink-0 text-[10px] text-zinc-500 text-right opacity-0 group-hover:opacity-100 select-none pt-1">
                  {format(msg.createdAt, 'h:mm a')}
                </div>
              )}
              
              <div className="flex flex-col min-w-0 flex-1">
                {showHeader && (
                  <div className="flex items-baseline gap-2 mb-1">
                    <span 
                      className="font-medium text-indigo-500 dark:text-indigo-400 hover:underline cursor-pointer"
                      onClick={() => setActiveProfile(msg.senderId)}
                    >
                      {displayName}
                    </span>
                    <span className="text-xs text-zinc-500">{format(msg.createdAt, 'MM/dd/yyyy h:mm a')}</span>
                  </div>
                )}
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1 pr-16">
                    <div className="bg-white dark:bg-[#383a40] rounded-lg border border-zinc-200 dark:border-transparent flex items-center p-2 shadow-sm">
                      <input 
                        type="text"
                        autoFocus
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleEditSubmit(msg.id);
                          if (e.key === 'Escape') setEditingMessageId(null);
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-black dark:text-zinc-200 text-[15px]"
                      />
                    </div>
                    <div className="text-xs text-zinc-500 flex gap-1">
                      escape to <button onClick={() => setEditingMessageId(null)} className="text-indigo-500 hover:underline">cancel</button> • 
                      enter to <button onClick={() => handleEditSubmit(msg.id)} className="text-indigo-500 hover:underline">save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {msg.type === 'image' && msg.fileUrl && (
                      <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-black/20">
                        <img src={msg.fileUrl} alt="Uploaded attachment" className="max-w-full h-auto object-cover" />
                      </div>
                    )}
                    {msg.content && msg.content !== 'Uploaded Image' && (
                      <div className="text-zinc-800 dark:text-zinc-200 text-[15px] leading-relaxed break-words markdown-body flex items-baseline flex-wrap">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {msg.editedAt && (
                          <span className="text-[10px] text-zinc-500 ml-2 select-none inline-block relative -top-0.5">(edited)</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="px-4 pb-6 pt-2 relative">
        {selectedImage && (
          <div className="absolute bottom-full left-4 mb-2 p-2 bg-white dark:bg-[#2b2d31] rounded-lg shadow-xl border border-zinc-200 dark:border-white/10 w-48 relative">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
            <img src={selectedImage} alt="Selected" className="w-full h-32 object-cover rounded-md" />
            <div className="text-xs text-zinc-500 mt-2 truncate flex items-center gap-1">
              <FileImage size={12} /> Image attached
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-xl flex items-center px-4 py-3 gap-4 shadow-xl">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-zinc-300 transition-colors bg-zinc-100 dark:bg-[#404249] rounded-full p-1 flex-shrink-0"
          >
            <PlusCircle size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message #${channel.name}`}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-black dark:text-zinc-200 placeholder-zinc-500 py-1"
          />
          <button type="button" className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-zinc-300 transition-colors">
            <Smile size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
