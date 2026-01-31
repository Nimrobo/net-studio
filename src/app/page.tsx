'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, CardHeader, Badge, Button, PageLoading, EmptyState } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { userApi } from '@/lib/api';
import type { UserSummary } from '@/types';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    userApi
      .getSummary()
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader
          title="Welcome to Net Studio"
          description="Sign in to access your dashboard"
        />
        <Card className="max-w-md">
          <CardHeader title="Authentication Required" />
          <p className="text-muted-foreground mb-4">
            Please authenticate using the Nimrobo CLI to access Net Studio.
          </p>
          <pre className="bg-muted p-3 rounded text-sm mb-4">
            nimrobo screen login
          </pre>
          <p className="text-sm text-muted-foreground">
            Your credentials are automatically loaded from ~/.nimrobo/config.json
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Card>
          <p className="text-error">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your activity and notifications"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Unread Messages */}
        <Card>
          <CardHeader
            title="Messages"
            actions={
              <Link href="/messages">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            }
          />
          {summary?.unread_messages?.total ? (
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                {summary.unread_messages.total}
              </div>
              <p className="text-sm text-muted-foreground">
                unread messages across {summary.unread_messages.channels.length} channels
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No unread messages</p>
          )}
        </Card>

        {/* Pending Applicants */}
        <Card>
          <CardHeader
            title="Pending Applicants"
            actions={
              <Link href="/posts">
                <Button variant="ghost" size="sm">View Posts</Button>
              </Link>
            }
          />
          {summary?.pending_applicants?.total ? (
            <div>
              <div className="text-3xl font-bold text-warning mb-2">
                {summary.pending_applicants.total}
              </div>
              <p className="text-sm text-muted-foreground">
                across {summary.pending_applicants.posts.length} posts
              </p>
              <ul className="mt-3 space-y-1">
                {summary.pending_applicants.posts.slice(0, 3).map((post) => (
                  <li key={post.post_id} className="text-sm">
                    <Link href={`/posts/${post.post_id}`} className="hover:underline">
                      {post.title}
                    </Link>
                    <Badge variant="warning" size="sm" className="ml-2">
                      {post.pending_count}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">No pending applicants</p>
          )}
        </Card>

        {/* My Applications */}
        <Card>
          <CardHeader
            title="My Applications"
            actions={
              <Link href="/applications">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            }
          />
          {summary ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <Badge variant="warning">{summary.my_applications?.pending?.count ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Accepted</span>
                <Badge variant="success">{summary.my_applications?.accepted?.count ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rejected</span>
                <Badge variant="error">{summary.my_applications?.rejected?.count ?? 0}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No applications</p>
          )}
        </Card>

        {/* Org Invites */}
        {summary?.org_invites?.count ? (
          <Card>
            <CardHeader title="Organization Invites" />
            <div className="text-3xl font-bold text-primary mb-2">
              {summary.org_invites.count}
            </div>
            <ul className="space-y-2">
              {summary.org_invites.items.map((invite) => (
                <li key={invite.invite_id} className="flex items-center justify-between">
                  <span className="text-sm">{invite.org_name}</span>
                  <Link href={`/orgs?invite=${invite.invite_id}`}>
                    <Button size="sm">Review</Button>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* Join Requests to Review */}
        {summary?.org_join_requests?.count ? (
          <Card>
            <CardHeader title="Join Requests to Review" />
            <div className="text-3xl font-bold text-accent mb-2">
              {summary.org_join_requests.count}
            </div>
            <ul className="space-y-2">
              {summary.org_join_requests.items.slice(0, 5).map((req) => (
                <li key={req.request_id} className="text-sm">
                  <span className="font-medium">{req.user_name}</span>
                  <span className="text-muted-foreground"> wants to join </span>
                  <Link href={`/orgs/${req.org_id}`} className="hover:underline">
                    {req.org_name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
