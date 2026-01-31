'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Badge, Button, PageLoading, EmptyState, Input } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { orgApi, userApi } from '@/lib/api';
import type { Organization, OrgInvite } from '@/types';

export default function OrgsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [myOrgs, setMyOrgs] = useState<Organization[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'invites'>('my');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allOrgs, myOrgsData, myInvites] = await Promise.all([
        orgApi.list({ keyword: searchKeyword || undefined, status: 'active', limit: 50 }),
        userApi.getMyOrgs({ limit: 50 }),
        userApi.getMyInvites({ limit: 50 }),
      ]);
      setOrgs(allOrgs.data);
      setMyOrgs(myOrgsData.data);
      setInvites(myInvites.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
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
  }, [isAuthenticated, authLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await orgApi.acceptInvite(inviteId);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      await orgApi.declineInvite(inviteId);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline invite');
    }
  };

  if (authLoading || (loading && myOrgs.length === 0)) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Organizations" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view organizations.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Browse and manage organizations"
        actions={
          <Link href="/orgs/new">
            <Button>Create Organization</Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          My Organizations ({myOrgs.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Organizations
        </button>
        {invites.length > 0 && (
          <button
            onClick={() => setActiveTab('invites')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invites'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Invites ({invites.length})
          </button>
        )}
      </div>

      {error && (
        <Card className="mb-6">
          <p className="text-error">{error}</p>
        </Card>
      )}

      {activeTab === 'my' && (
        myOrgs.length === 0 ? (
          <EmptyState
            title="No organizations"
            description="You're not a member of any organizations yet."
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            action={
              <Link href="/orgs/new">
                <Button>Create Organization</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myOrgs.map((org) => (
              <Link key={org.id} href={`/orgs/${org.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground">{org.name}</h3>
                    <Badge variant={org.role === 'owner' ? 'primary' : org.role === 'admin' ? 'warning' : 'default'}>
                      {org.role}
                    </Badge>
                  </div>
                  {org.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {org.description}
                    </p>
                  )}
                  {org.website && (
                    <p className="text-xs text-muted-foreground truncate">{org.website}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === 'all' && (
        <div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input
              placeholder="Search organizations..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit">Search</Button>
          </form>

          {orgs.length === 0 ? (
            <EmptyState
              title="No organizations found"
              description="No organizations match your search criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.map((org) => (
                <Link key={org.id} href={`/orgs/${org.id}`}>
                  <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                    <h3 className="font-medium text-foreground mb-2">{org.name}</h3>
                    {org.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {org.description}
                      </p>
                    )}
                    {org.website && (
                      <p className="text-xs text-muted-foreground truncate">{org.website}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="space-y-4">
          {invites.map((invite) => (
            <Card key={invite.id} padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{invite.org_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Invited as <Badge>{invite.role}</Badge>
                    {invite.inviter_name && ` by ${invite.inviter_name}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAcceptInvite(invite.id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeclineInvite(invite.id)}>
                    Decline
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
