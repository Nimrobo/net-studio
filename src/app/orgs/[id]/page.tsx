'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardHeader, Badge, Button, PageLoading, Input, EmptyState } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { orgApi, userApi } from '@/lib/api';
import type { Organization, OrgMember, OrgInvite, JoinRequest, Post, User } from '@/types';

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'invites' | 'requests' | 'posts'>('overview');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Join request
  const [joinMessage, setJoinMessage] = useState('');
  const [sendingJoinRequest, setSendingJoinRequest] = useState(false);

  const orgId = params.id as string;

  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const isMember = !!myRole;

  const fetchData = async () => {
    try {
      const [orgData, userData] = await Promise.all([
        orgApi.get(orgId),
        userApi.getMe(),
      ]);
      setOrg(orgData);
      setUser(userData);

      // Check membership
      const myOrgs = await userApi.getMyOrgs({ limit: 100 });
      const myMembership = myOrgs.data.find((o) => o.id === orgId);
      if (myMembership) {
        setMyRole(myMembership.role || null);
      }

      // Fetch members
      const membersData = await orgApi.getMembers(orgId, { limit: 100 });
      setMembers(membersData.data);

      // If admin, fetch invites and join requests
      if (myMembership?.role === 'owner' || myMembership?.role === 'admin') {
        const [invitesData, requestsData] = await Promise.all([
          orgApi.getInvites(orgId, { limit: 50 }),
          orgApi.getJoinRequests(orgId, { limit: 50 }),
        ]);
        setInvites(invitesData.data);
        setJoinRequests(requestsData.data.filter((r) => r.status === 'pending'));
      }

      // Fetch org posts
      const postsData = await orgApi.getPosts(orgId, { limit: 20 });
      setPosts(postsData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
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
  }, [isAuthenticated, authLoading, orgId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    try {
      await orgApi.sendInvite(orgId, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      const invitesData = await orgApi.getInvites(orgId, { limit: 50 });
      setInvites(invitesData.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await orgApi.cancelInvite(orgId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel invite');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await orgApi.approveJoinRequest(requestId);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await orgApi.rejectJoinRequest(requestId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  const handleSendJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingJoinRequest(true);
    try {
      await orgApi.sendJoinRequest(orgId, joinMessage || undefined);
      alert('Join request sent!');
      setJoinMessage('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send join request');
    } finally {
      setSendingJoinRequest(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'admin' | 'member') => {
    try {
      await orgApi.updateMemberRole(orgId, userId, newRole);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await orgApi.removeMember(orgId, userId);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this organization?')) return;
    try {
      await orgApi.leave(orgId);
      router.push('/orgs');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave organization');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization? This cannot be undone.')) return;
    try {
      await orgApi.delete(orgId);
      router.push('/orgs');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete organization');
    }
  };

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Organization" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view this organization.</p>
        </Card>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div>
        <PageHeader title="Organization" />
        <Card>
          <p className="text-error">{error || 'Organization not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={org.name}
        description={org.website || undefined}
        actions={
          <div className="flex items-center gap-3">
            {myRole && (
              <Badge variant={myRole === 'owner' ? 'primary' : myRole === 'admin' ? 'warning' : 'default'} size="md">
                {myRole}
              </Badge>
            )}
            {isOwner && (
              <>
                <Link href={`/orgs/${orgId}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                <Button variant="danger" onClick={handleDelete}>Delete</Button>
              </>
            )}
            {isMember && !isOwner && (
              <Button variant="ghost" onClick={handleLeave}>Leave</Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Members ({members.length})
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('invites')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'invites' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Invites ({invites.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Join Requests ({joinRequests.length})
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Posts ({posts.length})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="About" />
            <p className="text-foreground whitespace-pre-wrap">
              {org.description || 'No description provided.'}
            </p>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Details" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={org.status === 'active' ? 'success' : 'default'}>
                      {org.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="font-medium">{members.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Posts</dt>
                  <dd className="font-medium">{posts.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(org.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </Card>

            {!isMember && (
              <Card>
                <CardHeader title="Join Organization" />
                <form onSubmit={handleSendJoinRequest} className="space-y-3">
                  <Input
                    placeholder="Why do you want to join? (optional)"
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                  />
                  <Button type="submit" isLoading={sendingJoinRequest} className="w-full">
                    Request to Join
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          {members.map((member) => (
            <Card key={member.id} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{member.user_name || 'Unknown'}</span>
                  <Badge className="ml-2" variant={member.role === 'owner' ? 'primary' : member.role === 'admin' ? 'warning' : 'default'}>
                    {member.role}
                  </Badge>
                </div>
                {isAdmin && member.user_id !== user?.id && (
                  <div className="flex items-center gap-2">
                    {isOwner && member.role !== 'owner' && (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value as 'owner' | 'admin' | 'member')}
                        className="text-sm px-2 py-1 rounded border border-border bg-background"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                    )}
                    {(isOwner || (isAdmin && member.role === 'member')) && (
                      <Button size="sm" variant="danger" onClick={() => handleRemoveMember(member.user_id)}>
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'invites' && isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Send Invite" />
            <form onSubmit={handleSendInvite} className="flex gap-3">
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" isLoading={sendingInvite}>Send</Button>
            </form>
          </Card>

          {invites.length === 0 ? (
            <EmptyState title="No pending invites" />
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <Card key={invite.id} padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{invite.invitee_email}</span>
                      <Badge className="ml-2">{invite.role}</Badge>
                      <p className="text-xs text-muted-foreground">
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleCancelInvite(invite.id)}>
                      Cancel
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && isAdmin && (
        joinRequests.length === 0 ? (
          <EmptyState title="No pending join requests" />
        ) : (
          <div className="space-y-4">
            {joinRequests.map((request) => (
              <Card key={request.id} padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{request.user_name || 'Unknown'}</span>
                    {request.message && (
                      <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveRequest(request.id)}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRejectRequest(request.id)}>Reject</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <EmptyState
            title="No posts"
            description="This organization hasn't created any posts yet."
            action={
              isMember ? (
                <Link href={`/posts/new?org=${orgId}`}>
                  <Button>Create Post</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
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
                  <p className="text-xs text-muted-foreground">
                    {post.application_count} applications
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
