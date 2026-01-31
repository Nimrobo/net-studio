'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Card, CardHeader, Button, Input, Textarea, PageLoading, Badge } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { userApi } from '@/lib/api';
import type { User } from '@/types';

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    userApi
      .getMe()
      .then((data) => {
        setUser(data);
        setName(data.profile?.data?.name || '');
        setCity(data.profile?.data?.location?.city || '');
        setCountry(data.profile?.data?.location?.country || '');
        setShortBio(data.profile?.data?.short_bio || '');
        setContent(data.profile?.content || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userApi.updateMe({
        data: {
          name: name || undefined,
          location: city || country ? { city: city || undefined, country: country || undefined } : undefined,
          short_bio: shortBio || undefined,
        },
        content: content || undefined,
      });
      setUser(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Profile" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to view your profile.</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Profile" />
        <Card>
          <p className="text-error">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your personal information"
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                Save Changes
              </Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader title="Personal Information" />

          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                />
              </div>
              <Input
                label="Short Bio"
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value)}
                placeholder="A brief description about yourself"
              />
              <Textarea
                label="About"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell people more about yourself..."
                rows={6}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="mt-1 text-foreground">{user?.profile?.data?.name || '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="mt-1 text-foreground">
                  {[user?.profile?.data?.location?.city, user?.profile?.data?.location?.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Short Bio</label>
                <p className="mt-1 text-foreground">{user?.profile?.data?.short_bio || '—'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">About</label>
                <p className="mt-1 text-foreground whitespace-pre-wrap">
                  {user?.profile?.content || '—'}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader title="Account" />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="mt-1 text-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="mt-1 text-foreground text-xs font-mono">{user?.id}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
