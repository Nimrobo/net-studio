'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Badge, Button, PageLoading, EmptyState, Input } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { userApi, applicationApi } from '@/lib/api';
import type { Application } from '@/types';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default',
};

export default function ApplicationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await userApi.getMyApplications({
        status: statusFilter || undefined,
        keyword: searchKeyword || undefined,
        limit: 50,
      });
      setApplications(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
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
    fetchApplications();
  }, [isAuthenticated, authLoading, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleWithdraw = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await applicationApi.withdraw(id);
      fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to withdraw application');
    }
  };

  if (authLoading || (loading && applications.length === 0)) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="My Applications" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view your applications.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Applications"
        description="Track your job applications"
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {['', 'pending', 'accepted', 'rejected', 'withdrawn'].map((status) => (
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
              placeholder="Search applications..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
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
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          description="You haven't applied to any posts yet."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          action={
            <Link href="/posts">
              <Button>Browse Posts</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link href={`/posts/${app.post_id}`} className="text-lg font-medium hover:underline">
                      {app.post_title || 'Untitled Post'}
                    </Link>
                    <Badge variant={statusColors[app.status]}>{app.status}</Badge>
                    {app.post_status === 'closed' && (
                      <Badge variant="default">Post Closed</Badge>
                    )}
                  </div>
                  {app.content_md && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                      {app.content_md}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                    {app.updated_at !== app.created_at && (
                      <span>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  {app.rejection_reason && (
                    <p className="mt-2 text-sm text-error">
                      Rejection reason: {app.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={`/posts/${app.post_id}`}>
                    <Button variant="ghost" size="sm">View Post</Button>
                  </Link>
                  {app.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleWithdraw(app.id)}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
