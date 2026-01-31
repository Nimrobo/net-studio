'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Badge, Button, PageLoading, EmptyState, Input } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { postApi } from '@/lib/api';
import type { Post } from '@/types';

export default function PostsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await postApi.list({
        status: statusFilter || undefined,
        query: searchQuery || undefined,
        exclude_applied: 'false',
        limit: 50,
      });
      setPosts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
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
    fetchPosts();
  }, [isAuthenticated, authLoading, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  if (authLoading || (loading && posts.length === 0)) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Posts" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view posts.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Browse and discover opportunities"
        actions={
          <Link href="/posts/new">
            <Button>Create Post</Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {['open', 'closed', ''].map((status) => (
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
          <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button type="submit" size="sm">Search</Button>
          </form>
        </div>
      </Card>

      {error ? (
        <Card>
          <p className="text-error">{error}</p>
        </Card>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts found"
          description="No posts match your search criteria."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          }
          action={
            <Link href="/posts/new">
              <Button>Create First Post</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-foreground line-clamp-1">{post.title}</h3>
                  <Badge variant={post.status === 'open' ? 'success' : 'default'}>
                    {post.status}
                  </Badge>
                </div>
                {post.short_content && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.short_content}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {post.org_name && (
                      <span className="text-muted-foreground">{post.org_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{post.application_count} applications</span>
                    <span>
                      Expires {new Date(post.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {post.my_application_status && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Badge variant={post.my_application_status === 'accepted' ? 'success' : post.my_application_status === 'rejected' ? 'error' : 'warning'}>
                      Applied: {post.my_application_status}
                    </Badge>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
