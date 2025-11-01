export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  key: string;
  description?: string;
  created_at: string;
  members?: ProjectMember[];
  issue_count?: number;
  member_count?: number;
}

export interface ProjectMember {
  user: User;
  role: 'member' | 'maintainer';
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Issue {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  reporter: User;
  reporter_id: number;
  assignee?: User;
  assignee_id?: number;
  expected_completion_date?: string;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface Comment {
  id: number;
  issue_id: number;
  author: User;
  author_id: number;
  body: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ErrorResponse {
  detail: string;
}
