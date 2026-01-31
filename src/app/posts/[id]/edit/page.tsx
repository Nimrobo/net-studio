'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, Card, CardHeader, Button, Input, Textarea, PageLoading } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { postApi, userApi } from '@/lib/api';
import type { Post, Organization } from '@/types';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [shortContent, setShortContent] = useState('');
  const [longContent, setLongContent] = useState('');
  const [orgId, setOrgId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState('');

  const postId = params.id as string;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [postData, orgsData] = await Promise.all([
          postApi.get(postId),
          userApi.getMyOrgs({ limit: 100 }),
        ]);
        setPost(postData);
        setOrgs(orgsData.data.filter((o) => o.status === 'active'));

        // Populate form
        setTitle(postData.title);
        setShortContent(postData.short_content || '');
        setLongContent(postData.long_content || '');
        setOrgId(postData.org_id || '');
        setExpiresAt(postData.expires_at.split('T')[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await postApi.update(postId, {
        title: title.trim(),
        short_content: shortContent.trim() || undefined,
        long_content: longContent.trim() || undefined,
        org_id: orgId || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      router.push(`/posts/${postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Edit Post" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to edit this post.</p>
        </Card>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div>
        <PageHeader title="Edit Post" />
        <Card>
          <p className="text-error">{error}</p>
        </Card>
      </div>
    );
  }

  const hasApplications = post && post.application_count > 0;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Edit Post"
        description={post?.title}
      />

      {hasApplications && (
        <Card className="mb-6 bg-warning/10 border-warning/20">
          <p className="text-sm text-warning">
            This post has received applications. Some fields cannot be modified.
          </p>
        </Card>
      )}

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
            />

            <Textarea
              label="Full Description"
              value={longContent}
              onChange={(e) => setLongContent(e.target.value)}
              placeholder="Detailed description, requirements, responsibilities..."
              rows={8}
            />

            {orgs.length > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  Organization
                </label>
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  disabled={!!hasApplications}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Personal post (no organization)</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {hasApplications && (
                  <p className="text-xs text-muted-foreground">Cannot change after receiving applications</p>
                )}
              </div>
            )}

            <Input
              label="Expires On"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              helperText={hasApplications ? 'Can only extend, not shorten' : 'Post will close on this date'}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
