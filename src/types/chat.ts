export interface Message {
  _id?: string;
  message: string;
  sender_type: 'user' | 'reviewer';
  createdAt: string;
}

export interface ChatRoom {
  _id: string;
  paperId: string;
  userId: string;
  reviewer_id: string;
  status: 'pending' | 'completed' | 'declined';
  closed: boolean;
  paperName: string;
  theme: string;
  topic: string;
  date: string;
  deadline: string;
  hall: string;
  rules: string;
  teamSize: number;
  tagline: string;
  userName: string;
  userEmail: string;
  paperTitle?: string;
  reviewerName?: string;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}