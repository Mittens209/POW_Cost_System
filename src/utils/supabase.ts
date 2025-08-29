import { Item, Project, ProjectItem, IndirectCosts, SupabaseConfig } from '@/types';

// Configuration - easily editable at top of file
const SUPABASE_CONFIG: SupabaseConfig = {
  url: '', // Add your Supabase URL here
  anonKey: '', // Add your Supabase anon key here
};

class SupabaseClient {
  private baseUrl: string;
  private headers: HeadersInit;
  private isConfigured: boolean;

  constructor(config: SupabaseConfig) {
    this.baseUrl = config.url ? `${config.url}/rest/v1` : '';
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
    };
    this.isConfigured = Boolean(config.url && config.anonKey);
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('Supabase not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.statusText}`);
    }

    return response.json();
  }

  // Items CRUD
  async getItems(): Promise<Item[]> {
    return this.request<Item[]>('/items?order=category.asc,item_no.asc');
  }

  async createItem(item: Omit<Item, 'id' | 'date_added'>): Promise<Item> {
    const [result] = await this.request<Item[]>('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return result;
  }

  async updateItem(id: number, item: Partial<Item>): Promise<Item> {
    const [result] = await this.request<Item[]>(`/items?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(item),
    });
    return result;
  }

  async deleteItem(id: number): Promise<void> {
    await this.request(`/items?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  // Projects CRUD
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects?order=updated_at.desc');
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const [result] = await this.request<Project[]>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
    return result;
  }

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const [result] = await this.request<Project[]>(`/projects?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...project, updated_at: new Date().toISOString() }),
    });
    return result;
  }

  async deleteProject(id: string): Promise<void> {
    await this.request(`/projects?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  // Project Items CRUD
  async getProjectItems(projectId: string): Promise<ProjectItem[]> {
    // Get project items with joined item data
    const query = `
      /project_items?project_id=eq.${projectId}&select=
      id,project_id,item_id,quantity,unit_cost,total_cost,
      items(item_no,description,category,unit,cost_type)
    `;
    const data = await this.request<any[]>(query);
    
    // Flatten the joined data
    return data.map(pi => ({
      ...pi,
      item_no: pi.items.item_no,
      description: pi.items.description,
      category: pi.items.category,
      unit: pi.items.unit,
      cost_type: pi.items.cost_type,
    }));
  }

  async createProjectItem(projectItem: Omit<ProjectItem, 'id' | 'total_cost' | 'item_no' | 'description' | 'category' | 'unit' | 'cost_type'>): Promise<ProjectItem> {
    const [result] = await this.request<ProjectItem[]>('/project_items', {
      method: 'POST',
      body: JSON.stringify(projectItem),
    });
    return result;
  }

  async updateProjectItem(id: number, projectItem: Partial<ProjectItem>): Promise<ProjectItem> {
    const [result] = await this.request<ProjectItem[]>(`/project_items?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectItem),
    });
    return result;
  }

  async deleteProjectItem(id: number): Promise<void> {
    await this.request(`/project_items?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  // Indirect Costs
  async getIndirectCosts(projectId: string): Promise<IndirectCosts | null> {
    const results = await this.request<IndirectCosts[]>(`/indirect_costs?project_id=eq.${projectId}`);
    return results[0] || null;
  }

  async upsertIndirectCosts(indirectCosts: Omit<IndirectCosts, 'id'>): Promise<IndirectCosts> {
    const [result] = await this.request<IndirectCosts[]>('/indirect_costs', {
      method: 'POST',
      body: JSON.stringify(indirectCosts),
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });
    return result;
  }

  isConnected(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const supabase = new SupabaseClient(SUPABASE_CONFIG);

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => supabase.isConnected();