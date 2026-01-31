'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, Card, CardHeader, Button, Input, Textarea, PageLoading } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { orgApi } from '@/lib/api';
import type { Organization } from '@/types';

export default function EditOrgPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  const orgId = params.id as string;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    orgApi
      .get(orgId)
      .then((data) => {
        setOrg(data);
        setName(data.name);
        setDescription(data.description || '');
        setWebsite(data.website || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await orgApi.update(orgId, {
        name: name.trim(),
        description: description.trim() || null,
        website: website.trim() || null,
      });
      router.push(`/orgs/${orgId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Edit Organization" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to edit this organization.</p>
        </Card>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div>
        <PageHeader title="Edit Organization" />
        <Card>
          <p className="text-error">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Edit Organization"
        description={org?.name}
      />

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <CardHeader title="Organization Details" />

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Inc."
              required
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people about your organization..."
              rows={4}
            />

            <Input
              label="Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
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
