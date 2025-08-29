import { Item, Project, ProjectItem, IndirectCosts } from '@/types';

// UUID generator function
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// localStorage keys
const KEYS = {
  ITEMS: 'pow_cost_items',
  PROJECTS: 'pow_cost_projects',
  PROJECT_ITEMS: 'pow_cost_project_items',
  INDIRECT_COSTS: 'pow_cost_indirect_costs',
  SETTINGS: 'pow_cost_settings',
} as const;

// Helper functions
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error);
  }
};

// Items management
export const localStorageItems = {
  getAll(): Item[] {
    return getFromStorage(KEYS.ITEMS, []);
  },

  save(items: Item[]): void {
    saveToStorage(KEYS.ITEMS, items);
  },

  add(item: Omit<Item, 'id' | 'date_added'>): Item {
    const items = this.getAll();
    const newItem: Item = {
      ...item,
      id: Math.max(0, ...items.map(i => i.id)) + 1,
      date_added: new Date().toISOString(),
    };
    items.push(newItem);
    this.save(items);
    return newItem;
  },

  update(id: number, updates: Partial<Item>): Item | null {
    const items = this.getAll();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.save(items);
    return items[index];
  },

  delete(id: number): boolean {
    const items = this.getAll();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length !== items.length) {
      this.save(filtered);
      return true;
    }
    return false;
  },

  findByItemNo(itemNo: string): Item | null {
    return this.getAll().find(item => item.item_no === itemNo) || null;
  },
};

// Projects management
export const localStorageProjects = {
  getAll(): Project[] {
    return getFromStorage(KEYS.PROJECTS, []);
  },

  save(projects: Project[]): void {
    saveToStorage(KEYS.PROJECTS, projects);
  },

  add(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const projects = this.getAll();
    const newProject: Project = {
      ...project,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    projects.push(newProject);
    this.save(projects);
    return newProject;
  },

  update(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    projects[index] = { 
      ...projects[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    this.save(projects);
    return projects[index];
  },

  delete(id: string): boolean {
    const projects = this.getAll();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length !== projects.length) {
      this.save(filtered);
      // Also delete related project items and indirect costs
      localStorageProjectItems.deleteByProject(id);
      localStorageIndirectCosts.deleteByProject(id);
      return true;
    }
    return false;
  },

  findById(id: string): Project | null {
    return this.getAll().find(project => project.id === id) || null;
  },
};

// Project Items management
export const localStorageProjectItems = {
  getAll(): ProjectItem[] {
    return getFromStorage(KEYS.PROJECT_ITEMS, []);
  },

  save(projectItems: ProjectItem[]): void {
    saveToStorage(KEYS.PROJECT_ITEMS, projectItems);
  },

  getByProject(projectId: string): ProjectItem[] {
    return this.getAll().filter(pi => pi.project_id === projectId);
  },

  add(projectItem: Omit<ProjectItem, 'id' | 'total_cost'>): ProjectItem {
    const projectItems = this.getAll();
    const newProjectItem: ProjectItem = {
      ...projectItem,
      id: Math.max(0, ...projectItems.map(pi => pi.id)) + 1,
      total_cost: projectItem.quantity * projectItem.unit_cost,
    };
    projectItems.push(newProjectItem);
    this.save(projectItems);
    return newProjectItem;
  },

  update(id: number, updates: Partial<ProjectItem>): ProjectItem | null {
    const projectItems = this.getAll();
    const index = projectItems.findIndex(pi => pi.id === id);
    if (index === -1) return null;
    
    const updated = { ...projectItems[index], ...updates };
    updated.total_cost = updated.quantity * updated.unit_cost;
    projectItems[index] = updated;
    this.save(projectItems);
    return updated;
  },

  delete(id: number): boolean {
    const projectItems = this.getAll();
    const filtered = projectItems.filter(pi => pi.id !== id);
    if (filtered.length !== projectItems.length) {
      this.save(filtered);
      return true;
    }
    return false;
  },

  deleteByProject(projectId: string): void {
    const projectItems = this.getAll().filter(pi => pi.project_id !== projectId);
    this.save(projectItems);
  },
};

// Indirect Costs management
export const localStorageIndirectCosts = {
  getAll(): IndirectCosts[] {
    return getFromStorage(KEYS.INDIRECT_COSTS, []);
  },

  save(indirectCosts: IndirectCosts[]): void {
    saveToStorage(KEYS.INDIRECT_COSTS, indirectCosts);
  },

  getByProject(projectId: string): IndirectCosts | null {
    return this.getAll().find(ic => ic.project_id === projectId) || null;
  },

  upsert(indirectCosts: Omit<IndirectCosts, 'id'>): IndirectCosts {
    const allIndirectCosts = this.getAll();
    const existing = allIndirectCosts.find(ic => ic.project_id === indirectCosts.project_id);
    
    if (existing) {
      const updated = { ...existing, ...indirectCosts };
      const index = allIndirectCosts.findIndex(ic => ic.id === existing.id);
      allIndirectCosts[index] = updated;
      this.save(allIndirectCosts);
      return updated;
    } else {
      const newIndirectCosts: IndirectCosts = {
        ...indirectCosts,
        id: Math.max(0, ...allIndirectCosts.map(ic => ic.id)) + 1,
      };
      allIndirectCosts.push(newIndirectCosts);
      this.save(allIndirectCosts);
      return newIndirectCosts;
    }
  },

  deleteByProject(projectId: string): void {
    const indirectCosts = this.getAll().filter(ic => ic.project_id !== projectId);
    this.save(indirectCosts);
  },
};

// Settings management
export interface AppSettings {
  defaultOcmPercent: number;
  defaultProfitPercent: number;
  defaultTaxPercent: number;
  currencySymbol: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const localStorageSettings = {
  get(): AppSettings {
    return getFromStorage(KEYS.SETTINGS, {
      defaultOcmPercent: 5.0,
      defaultProfitPercent: 8.0,
      defaultTaxPercent: 12.0,
      currencySymbol: '₱',
      supabaseUrl: '',
      supabaseAnonKey: '',
    });
  },

  save(settings: AppSettings): void {
    saveToStorage(KEYS.SETTINGS, settings);
  },

  update(updates: Partial<AppSettings>): AppSettings {
    const current = this.get();
    const updated = { ...current, ...updates };
    this.save(updated);
    return updated;
  },
};