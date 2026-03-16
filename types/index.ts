export interface ScrapedData {
  url?: string;
  title?: string;
  summary?: string;
  content?: string;
  type?: string;
  items?: ScrapedData[];
  timestamp?: string;
  items_found?: number;
  [key: string]: unknown;
}

export interface TaskResult {
  id: string;
  taskId: string;
  data: ScrapedData;
  structuredData?: Record<string, unknown>;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  userId: string;
  urls: string[];
  keywords: string;
  instructions: string;
  structuringInstructions?: string;
  structuringSchema?: Record<string, unknown>;
  config: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  progress?: number;
  current_step?: string;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  results?: TaskResult[];
}

export interface CreateTaskDto {
  name: string;
  urls?: string[];
  keywords?: string;
  instructions: string;
  structuringInstructions?: string;
  config?: Record<string, unknown>;
}
