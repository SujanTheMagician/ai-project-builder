import { create } from "zustand";
import { Project, GeneratedBlueprint, ChatMessage } from "@/types";

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  currentBlueprint: GeneratedBlueprint | null;
  isGenerating: boolean;
  chatMessages: ChatMessage[];
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentBlueprint: (blueprint: GeneratedBlueprint | null) => void;
  setIsGenerating: (val: boolean) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  currentBlueprint: null,
  isGenerating: false,
  chatMessages: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentBlueprint: (blueprint) => set({ currentBlueprint: blueprint }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),
}));
