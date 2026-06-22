export interface ProjectFormData {
  name: string;
  category: string;
  description: string;
  audience: string;
  features: string;
  budget: string;
  timeline: string;
}

export interface TechItem {
  layer: string;
  stack: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  desc: string;
  requestBody?: string;
  responseBody?: string;
  statusCodes?: string[];
}

export interface RoadmapPhase {
  n: number;
  title: string;
  dur: string;
  tasks: string[];
}

export interface Sprint {
  title: string;
  tasks: string[];
}

export interface CostRow {
  label: string;
  amount: string;
  note?: string;
}

export interface DatabaseTable {
  name: string;
  cols: { n: string; t: string; k: "PK" | "FK" | ""; desc?: string }[];
}

export interface GeneratedBlueprint {
  summary: string;
  problem: string;
  targetUsers: string;
  requirements: string[];
  nonFunctional: string[];
  tech: TechItem[];
  apiEndpoints: ApiEndpoint[];
  roadmap: RoadmapPhase[];
  sprints: Sprint[];
  costRows: CostRow[];
  dbTables: DatabaseTable[];
  folderStructure: string;
  userStories: string[];
  deploymentStrategy: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  category: string;
  description: string;
  audience?: string | null;
  features?: string | null;
  budget?: string | null;
  timeline?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  documents?: Document[];
}

export interface Document {
  id: string;
  projectId: string;
  type: string;
  content: GeneratedBlueprint;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}
