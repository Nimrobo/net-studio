'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Badge, Button, PageLoading, EmptyState } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { channelApi, userApi } from '@/lib/api';
import type { Channel, UserSummary } from '@/types';

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const [channelsData, summaryData] = await Promise.all([
        channelApi.list({ status: statusFilter || undefined, limit: 50 }),
        userApi.getSummary(),
      ]);
      setChannels(channelsData.data);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
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
    fetchChannels();
  }, [isAuthenticated, authLoading, statusFilter]);

  const getUnreadCount = (channelId: string): number => {
    if (!summary) return 0;
    const channel = summary.unread_messages.channels.find((c) => c.channel_id === channelId);
    return channel?.unread_count || 0;
  };

  if (authLoading || (loading && channels.length === 0)) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Messages" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view your messages.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description={summary?.unread_messages.total ? `${summary.unread_messages.total} unread` : 'Your conversations'}
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex gap-2">
          {['active', 'archived', ''].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status || 'All'}
            </Button>
          ))}
        </div>
      </Card>

      {error ? (
        <Card>
          <p className="text-error">{error}</p>
        </Card>
      ) : channels.length === 0 ? (
        <EmptyState
          title="No conversations"
          description="You don't have any messages yet. Apply to posts to start conversations."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          action={
            <Link href="/posts">
              <Button>Browse Posts</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => {
            const unreadCount = getUnreadCount(channel.id);
            return (
              <Link key={channel.id} href={`/messages/${channel.id}`}>
                <Card className={`hover:border-primary transition-colors cursor-pointer ${unreadCount > 0 ? 'border-primary/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {channel.user1_name} & {channel.user2_name}
                        </span>
                        {unreadCount > 0 && (
                          <Badge variant="primary">{unreadCount} unread</Badge>
                        )}
                        {channel.status === 'archived' && (
                          <Badge variant="default">Archived</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {channel.last_message_at
                          ? `Last message: ${new Date(channel.last_message_at).toLocaleDateString()}`
                          : 'No messages yet'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
