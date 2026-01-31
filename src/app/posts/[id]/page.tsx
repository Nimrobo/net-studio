'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardHeader, Badge, Button, PageLoading, Textarea, EmptyState } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { postApi, applicationApi, userApi } from '@/lib/api';
import type { Post, Application, User } from '@/types';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default',
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application form
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationContent, setApplicationContent] = useState('');
  const [applying, setApplying] = useState(false);

  // Review tab
  const [activeTab, setActiveTab] = useState<'details' | 'applications'>('details');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('');

  const postId = params.id as string;

  const isOwner = user && post && (user.id === post.author_id);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [postData, userData] = await Promise.all([
          postApi.get(postId),
          userApi.getMe(),
        ]);
        setPost(postData);
        setUser(userData);

        // Check if user is the owner
        if (userData.id === postData.author_id) {
          // Fetch applications for owner
          const appsResponse = await postApi.getApplications(postId, { limit: 50 });
          setApplications(appsResponse.data);
        } else {
          // Check if user has applied
          const myApp = await postApi.getMyApplication(postId);
          setMyApplication(myApp);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading, postId]);

  const fetchApplications = async () => {
    if (!isOwner) return;
    try {
      const response = await postApi.getApplications(postId, {
        status: appStatusFilter || undefined,
        limit: 50,
      });
      setApplications(response.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchApplications();
    }
  }, [appStatusFilter, isOwner]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    try {
      const app = await postApi.apply(postId, {
        content_md: applicationContent || undefined,
      });
      setMyApplication(app);
      setShowApplyForm(false);
      setApplicationContent('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleApplicationAction = async (appId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await applicationApi.accept(appId);
      } else {
        await applicationApi.reject(appId);
      }
      fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} application`);
    }
  };

  const handleClosePost = async () => {
    if (!confirm('Are you sure you want to close this post? All pending applications will be rejected.')) return;
    try {
      await postApi.close(postId);
      setPost((prev) => prev ? { ...prev, status: 'closed' } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to close post');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    try {
      await postApi.delete(postId);
      router.push('/posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Post" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view this post.</p>
        </Card>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div>
        <PageHeader title="Post" />
        <Card>
          <p className="text-error">{error || 'Post not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={post.title}
        description={post.org_name ? `Posted by ${post.org_name}` : undefined}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={post.status === 'open' ? 'success' : 'default'} size="md">
              {post.status}
            </Badge>
            {isOwner && post.status === 'open' && (
              <>
                <Link href={`/posts/${postId}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                <Button variant="secondary" onClick={handleClosePost}>
                  Close Post
                </Button>
              </>
            )}
            {isOwner && (
              <Button variant="danger" onClick={handleDeletePost}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs for owner */}
      {isOwner && (
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'applications'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Applications ({post.application_count})
          </button>
        </div>
      )}

      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {post.short_content && (
              <Card>
                <CardHeader title="Summary" />
                <p className="text-foreground">{post.short_content}</p>
              </Card>
            )}

            {post.long_content && (
              <Card>
                <CardHeader title="Description" />
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{post.long_content}</p>
                </div>
              </Card>
            )}

            {/* Apply Section */}
            {!isOwner && post.status === 'open' && !myApplication && (
              <Card>
                <CardHeader
                  title="Apply to this Post"
                  description="Submit your application below"
                />
                {showApplyForm ? (
                  <form onSubmit={handleApply}>
                    <Textarea
                      label="Cover Letter (optional)"
                      value={applicationContent}
                      onChange={(e) => setApplicationContent(e.target.value)}
                      placeholder="Tell them why you're a great fit..."
                      rows={6}
                    />
                    <div className="mt-4 flex gap-3">
                      <Button type="submit" isLoading={applying}>
                        Submit Application
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowApplyForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setShowApplyForm(true)}>
                    Apply Now
                  </Button>
                )}
              </Card>
            )}

            {/* My Application Status */}
            {myApplication && (
              <Card>
                <CardHeader
                  title="Your Application"
                  actions={
                    <Badge variant={statusColors[myApplication.status]}>
                      {myApplication.status}
                    </Badge>
                  }
                />
                {myApplication.content_md && (
                  <p className="text-muted-foreground mb-3">{myApplication.content_md}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Applied on {new Date(myApplication.created_at).toLocaleDateString()}
                </p>
                {myApplication.rejection_reason && (
                  <p className="mt-2 text-sm text-error">
                    Reason: {myApplication.rejection_reason}
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Details" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={post.status === 'open' ? 'success' : 'default'}>
                      {post.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Applications</dt>
                  <dd className="font-medium">{post.application_count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(post.created_at).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd>{new Date(post.expires_at).toLocaleDateString()}</dd>
                </div>
                {post.org_id && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Organization</dt>
                    <dd>
                      <Link href={`/orgs/${post.org_id}`} className="hover:underline text-primary">
                        {post.org_name}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </div>
      ) : (
        /* Applications Tab */
        <div>
          {/* Filter */}
          <Card className="mb-6">
            <div className="flex gap-2">
              {['', 'pending', 'accepted', 'rejected', 'withdrawn'].map((status) => (
                <Button
                  key={status}
                  variant={appStatusFilter === status ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setAppStatusFilter(status)}
                >
                  {status || 'All'}
                </Button>
              ))}
            </div>
          </Card>

          {applications.length === 0 ? (
            <EmptyState
              title="No applications"
              description="No applications match your filter criteria."
            />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} padding="lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{app.applicant_name || 'Anonymous'}</span>
                        <Badge variant={statusColors[app.status]}>{app.status}</Badge>
                      </div>
                      {app.content_md && (
                        <p className="text-muted-foreground text-sm mb-2 whitespace-pre-wrap">
                          {app.content_md}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApplicationAction(app.id, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleApplicationAction(app.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
