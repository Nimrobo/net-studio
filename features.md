# Nimrobo Net Studio - Features

## Post

### Core Post Management
- **Create post** - Title, short/long content, structured data, expiration date, optional org association
- **View post** - Get post details including content, metadata, and application count
- **Update post** - Modify title, content, expiration date, org association (restrictions after receiving applications)
- **Delete post** - Remove post (author or org admin/owner only)
- **Close post** - Close to new applications, auto-rejects pending applications

### Post Discovery
- **List posts** - Paginated listing with filtering
- **Semantic search** - Vector similarity search by query
- **Filter by status** - Open/closed posts
- **Filter by organization** - Posts from specific org
- **Filter by expiration** - Posts expiring before/after date
- **Filter by data fields** - Generic JSON filter for extracted metadata (compensation type, employment type, remote, salary range, experience, skills, location, etc.)
- **Exclude applied** - Hide posts user already applied to
- **Sorting** - By created_at, expires_at, or relevance

### Applications on Posts
- **Apply to post** - Submit application with data and markdown content
- **List applications** - View applications for owned posts (with status/keyword filters)
- **Check applied** - Check if current user applied to a post
- **Application limits** - Daily limit and max active applications enforced

---

## Messages (Channels)

### Channel Management
- **List channels** - View messaging threads with filters (status, application, post)
- **Get channel** - View channel details and participants
- **Auto-archiving** - Expired channels automatically archived

### Messaging
- **Send message** - Post markdown message to channel (active channels only)
- **List messages** - Paginated message history (newest first)
- **Get message** - View specific message (auto-marks as read for recipient)

### Read Status
- **Mark as read** - Mark individual message as read
- **Mark as unread** - Mark individual message as unread
- **Mark all read** - Mark all messages in channel as read
- **Read receipts** - Track read_at timestamp per message

---

## User

### Profile
- **Get my profile** - View own profile (email, name, location, bio, content)
- **Get user profile** - View another user's public profile
- **Update profile** - Modify name, location, short_bio, long-form content

### User Data
- **My organizations** - List orgs user is a member of (with role)
- **My posts** - List posts created by user
- **My applications** - List submitted applications (with status/keyword filters)
- **My invites** - List pending org invites received
- **My join requests** - List pending join requests sent

### Activity Summary
- **Summary** - Aggregated dashboard view:
  - Unread message count per channel
  - Pending applicants per owned post
  - Application status breakdown (pending/accepted/rejected)
  - Pending org invites
  - Join requests to review (for admins)

### User Search
- **Search users** - Filter by name, location, keyword with pagination

---

## Organization

### Core Org Management
- **Create org** - Name, description, website, custom data (creator becomes owner)
- **View org** - Get org details
- **Update org** - Modify name, description, website, data (owner/admin only)
- **Delete org** - Soft delete (owner only)
- **Leave org** - Voluntarily leave (owner cannot if sole owner)

### Organization Discovery
- **List orgs** - Paginated listing with filters
- **Filter by name/status/website** - Basic field filters
- **Keyword search** - Full-text search
- **Sorting** - By created_at or name

### Membership
- **List members** - View org members with roles
- **Update role** - Change member role (owner/admin/member)
- **Remove member** - Remove member from org (owner/admin, with restrictions)

### Invites
- **Send invite** - Invite by email with role (admin/member)
- **List invites** - View pending invites for org
- **Cancel invite** - Revoke pending invite
- **Accept invite** - Join org via invite
- **Decline invite** - Reject org invite

### Join Requests
- **Request to join** - Send join request with optional message
- **List join requests** - View pending requests for org
- **Approve request** - Accept join request with role assignment
- **Reject request** - Deny join request
- **Cancel request** - Withdraw own join request

### Organization Posts
- **List org posts** - View posts associated with organization

---

## Applications

### Application Management
- **Get application** - View application details
- **Accept application** - Creates messaging channel with applicant
- **Reject application** - Reject with optional reason
- **Withdraw application** - Applicant withdraws own application
- **Batch action** - Accept/reject multiple applications at once

### Application Statuses
- Pending
- Accepted
- Rejected
- Withdrawn
