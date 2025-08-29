export interface Item {
  id: number;
  item_no: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  unit_cost: number;
  cost_type: 'Material' | 'Labor' | 'Equipment';
  date_added: string;
}

export interface Project {
  id: string;
  title: string;
  location?: string;
  category?: string;
  identification_no?: string;
  duration?: string;
  source_of_fund?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id: number;
  project_id: string;
  item_id: number;
  quantity: number;
  unit_cost: number; // snapshot from items table
  total_cost: number;
  // Denormalized fields for display
  item_no: string;
  description: string;
  category: string;
  unit: string;
  cost_type: 'Material' | 'Labor' | 'Equipment';
}

export interface IndirectCosts {
  id: number;
  project_id: string;
  ocm_percent: number;
  profit_percent: number;
  tax_percent: number;
}

export interface CostBreakdown {
  direct_costs: {
    material: number;
    labor: number;
    equipment: number;
    total: number;
  };
  indirect_costs: {
    ocm: number;
    profit: number;
    taxes: number;
    total: number;
  };
  grand_total: number;
}

export interface CategorySubtotal {
  category: string;
  subtotal: number;
  percentage: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}