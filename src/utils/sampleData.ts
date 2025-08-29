import { Item } from '@/types';
import { localStorageItems, localStorageProjects } from './localStorage';

export const sampleItems: Omit<Item, 'id' | 'date_added'>[] = [
  // Site Works
  {
    item_no: 'SW-001',
    description: 'Site clearing and grubbing',
    category: 'Site Works',
    subcategory: 'Preparation',
    unit: 'm²',
    unit_cost: 45.00,
    cost_type: 'Labor'
  },
  {
    item_no: 'SW-002', 
    description: 'Excavation for foundation',
    category: 'Site Works',
    subcategory: 'Earthworks',
    unit: 'm³',
    unit_cost: 125.00,
    cost_type: 'Equipment'
  },
  {
    item_no: 'SW-003',
    description: 'Backfilling and compaction',
    category: 'Site Works',
    subcategory: 'Earthworks', 
    unit: 'm³',
    unit_cost: 85.00,
    cost_type: 'Labor'
  },

  // Structural Works
  {
    item_no: 'ST-001',
    description: 'Portland Cement 40kg',
    category: 'Structural Works',
    subcategory: 'Materials',
    unit: 'bag',
    unit_cost: 285.00,
    cost_type: 'Material'
  },
  {
    item_no: 'ST-002',
    description: 'Reinforcing steel bars 12mm',
    category: 'Structural Works',
    subcategory: 'Materials',
    unit: 'kg',
    unit_cost: 55.00,
    cost_type: 'Material'
  },
  {
    item_no: 'ST-003',
    description: 'Ready mix concrete Class B',
    category: 'Structural Works',
    subcategory: 'Concrete',
    unit: 'm³',
    unit_cost: 4250.00,
    cost_type: 'Material'
  },
  {
    item_no: 'ST-004',
    description: 'Concrete pouring and finishing',
    category: 'Structural Works',
    subcategory: 'Labor',
    unit: 'm³',
    unit_cost: 850.00,
    cost_type: 'Labor'
  },
  {
    item_no: 'ST-005',
    description: 'Steel reinforcement installation',
    category: 'Structural Works',
    subcategory: 'Labor',
    unit: 'kg',
    unit_cost: 18.00,
    cost_type: 'Labor'
  },

  // Architectural Works
  {
    item_no: 'AR-001',
    description: 'Hollow blocks 4" (100mm)',
    category: 'Architectural Works',
    subcategory: 'Masonry',
    unit: 'pc',
    unit_cost: 18.50,
    cost_type: 'Material'
  },
  {
    item_no: 'AR-002',
    description: 'Masonry works installation',
    category: 'Architectural Works',
    subcategory: 'Masonry',
    unit: 'm²',
    unit_cost: 450.00,
    cost_type: 'Labor'
  },
  {
    item_no: 'AR-003',
    description: 'Ceramic floor tiles 300x300mm',
    category: 'Architectural Works',
    subcategory: 'Finishes',
    unit: 'm²',
    unit_cost: 285.00,
    cost_type: 'Material'
  },
  {
    item_no: 'AR-004',
    description: 'Floor tile installation',
    category: 'Architectural Works',
    subcategory: 'Finishes',
    unit: 'm²',
    unit_cost: 125.00,
    cost_type: 'Labor'
  },

  // Electrical Works
  {
    item_no: 'EL-001',
    description: 'THWN wire 2.0mm²',
    category: 'Electrical Works',
    subcategory: 'Wiring',
    unit: 'm',
    unit_cost: 12.50,
    cost_type: 'Material'
  },
  {
    item_no: 'EL-002',
    description: 'PVC conduit 20mm',
    category: 'Electrical Works',
    subcategory: 'Conduit',
    unit: 'm',
    unit_cost: 35.00,
    cost_type: 'Material'
  },
  {
    item_no: 'EL-003',
    description: 'Electrical rough-in installation',
    category: 'Electrical Works',
    subcategory: 'Installation',
    unit: 'outlet',
    unit_cost: 285.00,
    cost_type: 'Labor'
  },

  // Plumbing Works  
  {
    item_no: 'PL-001',
    description: 'PVC pipe 4" (100mm)',
    category: 'Plumbing Works',
    subcategory: 'Pipes',
    unit: 'm',
    unit_cost: 125.00,
    cost_type: 'Material'
  },
  {
    item_no: 'PL-002',
    description: 'Water closet installation',
    category: 'Plumbing Works',
    subcategory: 'Fixtures',
    unit: 'ea',
    unit_cost: 1850.00,
    cost_type: 'Labor'
  },

  // Mechanical Works
  {
    item_no: 'MC-001',
    description: 'Split-type aircon 1HP',
    category: 'Mechanical Works',
    subcategory: 'HVAC',
    unit: 'ea',
    unit_cost: 28500.00,
    cost_type: 'Material'
  },
  {
    item_no: 'MC-002',
    description: 'Aircon installation and testing',
    category: 'Mechanical Works',
    subcategory: 'HVAC',
    unit: 'ea',
    unit_cost: 3500.00,
    cost_type: 'Labor'
  }
];

export const initializeSampleData = () => {
  // Only initialize if no items exist
  const existingItems = localStorageItems.getAll();
  if (existingItems.length === 0) {
    console.log('Initializing sample data...');
    sampleItems.forEach(item => {
      localStorageItems.add(item);
    });

    // Add a sample project
    const sampleProject = localStorageProjects.add({
      title: 'Sample Residential Building Project',
      location: 'Quezon City, Metro Manila',
      category: 'Residential',
      identification_no: 'RES-2024-001',
      duration: '6 months',
      source_of_fund: 'Private'
    });

    console.log('Sample data initialized successfully');
    return { itemsAdded: sampleItems.length, project: sampleProject };
  }
  
  return { itemsAdded: 0, project: null };
};