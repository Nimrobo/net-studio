'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, Badge, Button, PageLoading, Textarea } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { channelApi, userApi } from '@/lib/api';
import type { Channel, Message, User } from '@/types';

export default function ConversationPage() {
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Message compose
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelId = params.id as string;

  const fetchData = async () => {
    try {
      const [channelData, messagesData, userData] = await Promise.all([
        channelApi.get(channelId),
        channelApi.getMessages(channelId, { limit: 100 }),
        userApi.getMe(),
      ]);
      setChannel(channelData);
      // Messages come newest first, reverse for display
      setMessages(messagesData.data.reverse());
      setUser(userData);

      // Mark all as read
      await channelApi.markAllRead(channelId).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, channelId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || channel?.status === 'archived') return;

    setSending(true);
    try {
      const message = await channelApi.sendMessage(channelId, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = () => {
    if (!channel || !user) return null;
    if (channel.user1_id === user.id) {
      return { id: channel.user2_id, name: channel.user2_name };
    }
    return { id: channel.user1_id, name: channel.user1_name };
  };

  const otherUser = getOtherUser();

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Conversation" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view this conversation.</p>
        </Card>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div>
        <PageHeader title="Conversation" />
        <Card>
          <p className="text-error">{error || 'Conversation not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <PageHeader
        title={otherUser?.name || 'Conversation'}
        description={channel.status === 'archived' ? 'This conversation is archived' : undefined}
        actions={
          <div className="flex items-center gap-3">
            {channel.status === 'archived' && (
              <Badge variant="default">Archived</Badge>
            )}
            <Link href="/messages">
              <Button variant="ghost">Back to Messages</Button>
            </Link>
          </div>
        }
      />

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col" padding="none">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {message.sender_name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{message.content_md}</p>
                    <div className={`flex items-center gap-2 mt-1 text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                      <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOwn && message.is_read && message.read_at && (
                        <span>Read</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Compose */}
        {channel.status === 'active' ? (
          <form onSubmit={handleSendMessage} className="border-t border-border p-4">
            <div className="flex gap-3">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button type="submit" isLoading={sending} disabled={!newMessage.trim()}>
                Send
              </Button>
            </div>
          </form>
        ) : (
          <div className="border-t border-border p-4 text-center text-muted-foreground">
            This conversation is archived and no longer accepts messages.
          </div>
        )}
      </Card>
    </div>
  );
}
