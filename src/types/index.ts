// User types
export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  data: {
    name?: string;
    location?: {
      city?: string;
      country?: string;
    };
    short_bio?: string;
  };
  content?: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  data?: Record<string, unknown>;
  status: 'active' | 'deleted';
  role?: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  user_id: string;
  user_name: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface OrgInvite {
  id: string;
  org_id: string;
  org_name?: string;
  org_slug?: string;
  invitee_email?: string;
  inviter_name?: string;
  role: 'admin' | 'member';
  status?: string;
  expires_at: string;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  org_id: string;
  org_name?: string;
  org_slug?: string;
  user_id?: string;
  user_name?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Post types
export interface Post {
  id: string;
  author_id: string;
  org_id?: string;
  org_name?: string;
  org_status?: string;
  title: string;
  short_content?: string;
  long_content?: string;
  data?: Record<string, unknown>;
  expires_at: string;
  status: 'open' | 'closed';
  application_count: number;
  my_application_status?: string;
  created_at: string;
  updated_at: string;
}

// Application types
export interface Application {
  id: string;
  post_id: string;
  post_title?: string;
  post_status?: string;
  applicant_id: string;
  applicant_name?: string;
  data?: Record<string, unknown>;
  content_md?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Channel/Message types
export interface Channel {
  id: string;
  application_id: string;
  post_id: string;
  user1_id: string;
  user1_name: string;
  user2_id: string;
  user2_name: string;
  context?: Record<string, unknown>;
  last_message_at?: string;
  expires_at: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  content_md: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    skip: number;
    has_more: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// Summary types
export interface UserSummary {
  unread_messages: {
    total: number;
    channels: Array<{
      channel_id: string;
      unread_count: number;
    }>;
  };
  pending_applicants: {
    total: number;
    posts: Array<{
      post_id: string;
      title: string;
      pending_count: number;
    }>;
  };
  my_applications: {
    pending: { count: number; items: Application[] };
    accepted: { count: number; items: Application[] };
    rejected: { count: number; items: Application[] };
  };
  org_invites: {
    count: number;
    items: Array<{
      invite_id: string;
      org_id: string;
      org_name: string;
    }>;
  };
  org_join_requests: {
    count: number;
    items: Array<{
      request_id: string;
      org_id: string;
      org_name: string;
      user_id: string;
      user_name: string;
    }>;
  };
}
