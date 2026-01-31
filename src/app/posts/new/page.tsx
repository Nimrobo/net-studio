'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, CardHeader, Button, Input, Textarea, PageLoading } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { postApi, userApi } from '@/lib/api';
import type { Organization } from '@/types';

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [shortContent, setShortContent] = useState('');
  const [longContent, setLongContent] = useState('');
  const [orgId, setOrgId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoadingOrgs(false);
      return;
    }

    userApi
      .getMyOrgs({ limit: 100 })
      .then((res) => setOrgs(res.data.filter((o) => o.status === 'active')))
      .catch(console.error)
      .finally(() => setLoadingOrgs(false));

    // Set default expiration to 7 days from now
    const defaultExpires = new Date();
    defaultExpires.setDate(defaultExpires.getDate() + 7);
    setExpiresAt(defaultExpires.toISOString().split('T')[0]);
  }, [isAuthenticated, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const post = await postApi.create({
        title: title.trim(),
        short_content: shortContent.trim() || undefined,
        long_content: longContent.trim() || undefined,
        org_id: orgId || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      router.push(`/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      setLoading(false);
    }
  };

  if (authLoading || loadingOrgs) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Create Post" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to create a post.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create Post"
        description="Create a new job posting or opportunity"
      />

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <CardHeader title="Post Details" />

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              required
            />

            <Textarea
              label="Short Description"
              value={shortContent}
              onChange={(e) => setShortContent(e.target.value)}
              placeholder="Brief summary of the role (shown in listings)"
              rows={3}
              helperText="Max 2000 characters"
            />

            <Textarea
              label="Full Description"
              value={longContent}
              onChange={(e) => setLongContent(e.target.value)}
              placeholder="Detailed description, requirements, responsibilities..."
              rows={8}
              helperText="Max 10000 characters. Supports markdown."
            />

            {orgs.length > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  Organization (optional)
                </label>
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Personal post (no organization)</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Expires On"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              helperText="Post will close on this date"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Create Post
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
