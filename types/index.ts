export interface Task {
  id: string;
  name: string;
  userId: string;
  urls: string[];
  keywords: string;
  instructions: string;
  config: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  current_step?: string;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  results?: any[];
}

export interface CreateTaskDto {
  name: string;
  urls?: string[];
  keywords?: string;
  instructions: string;
  config?: any;
}
