export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  activeWorkItems?: number;
  completedWorkItems?: number;
}
