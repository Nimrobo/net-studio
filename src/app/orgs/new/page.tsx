'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, CardHeader, Button, Input, Textarea, PageLoading } from '@/components';
import { useAuth } from '@/components/AuthProvider';
import { orgApi } from '@/lib/api';

export default function NewOrgPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const org = await orgApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        website: website.trim() || undefined,
      });
      router.push(`/orgs/${org.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      setLoading(false);
    }
  };

  if (authLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Create Organization" />
        <Card>
          <p className="text-muted-foreground">Please authenticate to create an organization.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create Organization"
        description="Set up a new organization for your team"
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
            <Button type="submit" isLoading={loading}>
              Create Organization
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
