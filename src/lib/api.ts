import {
  User,
  Organization,
  OrgMember,
  OrgInvite,
  JoinRequest,
  Post,
  Application,
  Channel,
  Message,
  PaginatedResponse,
  UserSummary,
} from '@/types';

const NET_API_BASE_URL = 'https://net-315108406092.asia-south1.run.app';

// Config reading from ~/.nimrobo/config.json happens server-side
// For client-side, we'll use a server action or API route

async function getAuthHeaders(): Promise<HeadersInit> {
  // This will be populated by the config context
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('nimrobo_token')
    : null;

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${NET_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const json = await response.json();

  // API returns single objects wrapped in { data: ... }
  // Unwrap if it's a single object response (has 'data' but no 'pagination')
  if (json && typeof json === 'object' && 'data' in json && !('pagination' in json) && !Array.isArray(json.data)) {
    return json.data as T;
  }

  return json as T;
}

// User API
export const userApi = {
  getMe: () => apiRequest<User>('/v1/users/me'),

  updateMe: (profile: Partial<User['profile']>) =>
    apiRequest<User>('/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ profile }),
    }),

  getUser: (id: string) => apiRequest<User>(`/v1/users/${id}`),

  getMyOrgs: (params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Organization>>(`/v1/users/me/orgs${query ? `?${query}` : ''}`);
  },

  getMyPosts: (params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Post>>(`/v1/users/me/posts${query ? `?${query}` : ''}`);
  },

  getMyInvites: (params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<OrgInvite>>(`/v1/users/me/invites${query ? `?${query}` : ''}`);
  },

  getMyJoinRequests: (params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<JoinRequest>>(`/v1/users/me/join-requests${query ? `?${query}` : ''}`);
  },

  getMyApplications: (params?: { limit?: number; skip?: number; status?: string; keyword?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Application>>(`/v1/users/me/applications${query ? `?${query}` : ''}`);
  },

  getSummary: () => apiRequest<UserSummary>('/v1/users/me/summary'),
};

// Organization API
export const orgApi = {
  list: (params?: {
    limit?: number;
    skip?: number;
    name?: string;
    status?: string;
    keyword?: string;
    sort_field?: string;
    sort_order?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.name) searchParams.set('name', params.name);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    if (params?.sort_field) searchParams.set('sort_field', params.sort_field);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Organization>>(`/v1/orgs${query ? `?${query}` : ''}`);
  },

  get: (id: string) => apiRequest<Organization>(`/v1/orgs/${id}`),

  create: (data: { name: string; description?: string; website?: string; data?: Record<string, unknown> }) =>
    apiRequest<Organization>('/v1/orgs/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; description: string | null; website: string | null; data: Record<string, unknown> }>) =>
    apiRequest<Organization>(`/v1/orgs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string; id: string }>(`/v1/orgs/${id}`, {
      method: 'DELETE',
    }),

  leave: (id: string) =>
    apiRequest<{ message: string }>(`/v1/orgs/${id}/leave`, {
      method: 'POST',
    }),

  // Members
  getMembers: (id: string, params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<OrgMember>>(`/v1/orgs/${id}/members${query ? `?${query}` : ''}`);
  },

  updateMemberRole: (orgId: string, userId: string, role: 'owner' | 'admin' | 'member') =>
    apiRequest<OrgMember>(`/v1/orgs/${orgId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  removeMember: (orgId: string, userId: string) =>
    apiRequest<{ message: string }>(`/v1/orgs/${orgId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Invites
  getInvites: (id: string, params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<OrgInvite>>(`/v1/orgs/${id}/invites${query ? `?${query}` : ''}`);
  },

  sendInvite: (orgId: string, email: string, role: 'admin' | 'member') =>
    apiRequest<OrgInvite>(`/v1/orgs/${orgId}/sendinvite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  cancelInvite: (orgId: string, inviteId: string) =>
    apiRequest<{ message: string }>(`/v1/orgs/${orgId}/invites/${inviteId}`, {
      method: 'DELETE',
    }),

  acceptInvite: (inviteId: string) =>
    apiRequest<{ message: string; org_id: string; role: string }>(`/v1/org/invites/${inviteId}/accept`, {
      method: 'POST',
    }),

  declineInvite: (inviteId: string) =>
    apiRequest<{ message: string }>(`/v1/org/invites/${inviteId}/decline`, {
      method: 'POST',
    }),

  // Join Requests
  getJoinRequests: (id: string, params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<JoinRequest>>(`/v1/orgs/${id}/join-requests${query ? `?${query}` : ''}`);
  },

  sendJoinRequest: (orgId: string, message?: string) =>
    apiRequest<JoinRequest>(`/v1/orgs/${orgId}/sendjoinrequest`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  approveJoinRequest: (requestId: string, role?: 'admin' | 'member') =>
    apiRequest<{ message: string; user_id: string; org_id: string; role: string }>(`/v1/org/join-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  rejectJoinRequest: (requestId: string) =>
    apiRequest<{ message: string }>(`/v1/org/join-requests/${requestId}/reject`, {
      method: 'POST',
    }),

  cancelJoinRequest: (requestId: string) =>
    apiRequest<{ message: string }>(`/v1/org/join-requests/${requestId}`, {
      method: 'DELETE',
    }),

  // Posts
  getPosts: (id: string, params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Post>>(`/v1/orgs/${id}/posts${query ? `?${query}` : ''}`);
  },
};

// Post API
export const postApi = {
  list: (params?: {
    limit?: number;
    skip?: number;
    status?: string;
    org_id?: string;
    expires_after?: string;
    expires_before?: string;
    query?: string;
    filter?: string;
    sort_field?: string;
    sort_order?: string;
    exclude_applied?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.org_id) searchParams.set('org_id', params.org_id);
    if (params?.expires_after) searchParams.set('expires_after', params.expires_after);
    if (params?.expires_before) searchParams.set('expires_before', params.expires_before);
    if (params?.query) searchParams.set('query', params.query);
    if (params?.filter) searchParams.set('filter', params.filter);
    if (params?.sort_field) searchParams.set('sort_field', params.sort_field);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
    if (params?.exclude_applied) searchParams.set('exclude_applied', params.exclude_applied);
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Post>>(`/v1/posts${query ? `?${query}` : ''}`);
  },

  get: (id: string) => apiRequest<Post>(`/v1/posts/${id}`),

  create: (data: {
    title: string;
    short_content?: string;
    long_content?: string;
    data?: Record<string, unknown>;
    expires_at?: string;
    org_id?: string;
  }) =>
    apiRequest<Post>('/v1/posts/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{
    title: string;
    short_content: string;
    long_content: string;
    data: Record<string, unknown>;
    expires_at: string;
    org_id: string | null;
  }>) =>
    apiRequest<Post>(`/v1/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  close: (id: string) =>
    apiRequest<{ message: string; id: string }>(`/v1/posts/${id}/close`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiRequest<{ message: string; id: string }>(`/v1/posts/${id}`, {
      method: 'DELETE',
    }),

  // Applications
  apply: (postId: string, data?: { data?: Record<string, unknown>; content_md?: string }) =>
    apiRequest<Application>(`/v1/posts/${postId}/applications`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  getApplications: (postId: string, params?: { limit?: number; skip?: number; status?: string; keyword?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Application>>(`/v1/posts/${postId}/applications${query ? `?${query}` : ''}`);
  },

  getMyApplication: (postId: string) =>
    apiRequest<Application | null>(`/v1/posts/${postId}/applications/me`),
};

// Application API
export const applicationApi = {
  get: (id: string) => apiRequest<Application>(`/v1/applications/${id}`),

  accept: (id: string) =>
    apiRequest<{ message: string; channel_id: string }>(`/v1/applications/${id}/accept`, {
      method: 'POST',
    }),

  reject: (id: string, reason?: string) =>
    apiRequest<{ message: string }>(`/v1/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  withdraw: (id: string) =>
    apiRequest<{ message: string }>(`/v1/applications/${id}/withdraw`, {
      method: 'POST',
    }),

  batchAction: (action: 'accept' | 'reject', applicationIds: string[], reason?: string) =>
    apiRequest<{ message: string; results: Array<{ id: string; success: boolean; error?: string }> }>(
      '/v1/applications/batch',
      {
        method: 'POST',
        body: JSON.stringify({ action, application_ids: applicationIds, reason }),
      }
    ),
};

// Channel API
export const channelApi = {
  list: (params?: { limit?: number; skip?: number; status?: string; application_id?: string; post_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.application_id) searchParams.set('application_id', params.application_id);
    if (params?.post_id) searchParams.set('post_id', params.post_id);
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Channel>>(`/v1/channels${query ? `?${query}` : ''}`);
  },

  get: (id: string) => apiRequest<Channel>(`/v1/channels/${id}`),

  getMessages: (channelId: string, params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Message>>(`/v1/channels/${channelId}/messages${query ? `?${query}` : ''}`);
  },

  getMessage: (channelId: string, messageId: string) =>
    apiRequest<Message>(`/v1/channels/${channelId}/messages/${messageId}`),

  sendMessage: (channelId: string, content_md: string) =>
    apiRequest<Message>(`/v1/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content_md }),
    }),

  markAsRead: (channelId: string, messageId: string) =>
    apiRequest<{ message: string; message_id: string; read_at: string }>(
      `/v1/channels/${channelId}/messages/${messageId}/read`,
      { method: 'POST' }
    ),

  markAsUnread: (channelId: string, messageId: string) =>
    apiRequest<{ message: string; message_id: string }>(
      `/v1/channels/${channelId}/messages/${messageId}/read`,
      { method: 'DELETE' }
    ),

  markAllRead: (channelId: string) =>
    apiRequest<{ message: string; channel_id: string; messages_marked: number }>(
      `/v1/channels/${channelId}/read-all`,
      { method: 'POST' }
    ),
};
