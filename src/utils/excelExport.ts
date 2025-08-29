import { Project, ProjectItem, CostBreakdown, CategorySubtotal } from '@/types';
import * as XLSX from 'xlsx';

export interface ExcelExportData {
  project: Project;
  projectItems: ProjectItem[];
  costBreakdown: CostBreakdown;
  categorySubtotals: CategorySubtotal[];
  indirectRates: {
    ocm_percent: number;
    profit_percent: number;
    tax_percent: number;
  };
}

export const exportToExcel = (data: ExcelExportData) => {
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Add worksheets
  const powSheet = createPOWSheet(data);
  const subtotalsSheet = createSubtotalsSheet(data);
  const breakdownSheet = createBreakdownSheet(data);
  
  XLSX.utils.book_append_sheet(workbook, powSheet, 'Program of Works');
  XLSX.utils.book_append_sheet(workbook, subtotalsSheet, 'Category Subtotals');
  XLSX.utils.book_append_sheet(workbook, breakdownSheet, 'Cost Breakdown');
  
  // Download file
  const filename = `POW_${data.project.identification_no || data.project.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

const createPOWSheet = (data: ExcelExportData) => {
  const { project, projectItems, costBreakdown, categorySubtotals } = data;
  
  // Group items by category
  const itemsByCategory = projectItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ProjectItem[]>);

  const worksheetData: any[][] = [];
  
  // Project header
  worksheetData.push(['PROGRAM OF WORKS']);
  worksheetData.push([project.title]);
  worksheetData.push([]);
  worksheetData.push(['Project Location:', project.location || '', '', 'Project ID:', project.identification_no || '']);
  worksheetData.push(['Source of Fund:', project.source_of_fund || '', '', 'Duration:', project.duration || '']);
  worksheetData.push([]);
  
  // Table headers
  worksheetData.push(['Item No.', 'Scope of Work', '% Weight', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost']);
  
  // Items by category
  Object.entries(itemsByCategory).forEach(([category, items]) => {
    // Category header
    worksheetData.push([category.toUpperCase()]);
    
    // Items
    items.forEach(item => {
      const percentage = (item.total_cost / costBreakdown.direct_costs.total) * 100;
      worksheetData.push([
        item.item_no,
        item.description,
        percentage / 100,
        item.quantity,
        item.unit,
        item.unit_cost,
        item.total_cost
      ]);
    });
    
    // Category subtotal
    const categorySubtotal = categorySubtotals.find(cs => cs.category === category);
    if (categorySubtotal) {
      worksheetData.push(['', '', '', '', '', `SUBTOTAL - ${category}`, categorySubtotal.subtotal]);
    }
    worksheetData.push([]);
  });
  
  // Grand total
  worksheetData.push(['', '', '', '', '', 'TOTAL DIRECT COST', costBreakdown.direct_costs.total]);
  worksheetData.push([]);
  worksheetData.push([]);
  
  // Signatories
  worksheetData.push(['Prepared by:', '', 'Recommended by:', '', 'Approved by:']);
  worksheetData.push([]);
  worksheetData.push([]);
  worksheetData.push(['_____________________', '', '_____________________', '', '_____________________']);
  worksheetData.push(['Project Engineer', '', 'Project Manager', '', 'Approving Authority']);
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Apply formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Set column widths
  worksheet['!cols'] = [
    { width: 10 }, // Item No.
    { width: 50 }, // Description
    { width: 12 }, // % Weight
    { width: 12 }, // Quantity
    { width: 10 }, // Unit
    { width: 15 }, // Unit Cost
    { width: 18 }  // Total Cost
  ];
  
  return worksheet;
};

const createSubtotalsSheet = (data: ExcelExportData) => {
  const { categorySubtotals, costBreakdown } = data;
  
  const worksheetData: any[][] = [];
  
  worksheetData.push(['COST BREAKDOWN BY CATEGORY']);
  worksheetData.push([]);
  worksheetData.push(['Category', 'Subtotal Cost', '% of Direct Cost']);
  
  categorySubtotals.forEach(cs => {
    worksheetData.push([cs.category, cs.subtotal, cs.percentage / 100]);
  });
  
  worksheetData.push(['GRAND TOTAL', costBreakdown.direct_costs.total, 1.00]);
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  worksheet['!cols'] = [
    { width: 30 }, // Category
    { width: 18 }, // Subtotal Cost
    { width: 18 }  // % of Direct Cost
  ];
  
  return worksheet;
};

const createBreakdownSheet = (data: ExcelExportData) => {
  const { costBreakdown, indirectRates } = data;
  
  const worksheetData: any[][] = [];
  
  worksheetData.push(['PROJECT COST BREAKDOWN']);
  worksheetData.push([]);
  worksheetData.push(['Cost Type', 'Amount', '% of Total Cost']);
  
  // Direct costs
  worksheetData.push(['Direct Costs:', costBreakdown.direct_costs.total, costBreakdown.direct_costs.total / costBreakdown.grand_total]);
  worksheetData.push(['  - Materials', costBreakdown.direct_costs.material, costBreakdown.direct_costs.material / costBreakdown.grand_total]);
  worksheetData.push(['  - Labor', costBreakdown.direct_costs.labor, costBreakdown.direct_costs.labor / costBreakdown.grand_total]);
  worksheetData.push(['  - Equipment', costBreakdown.direct_costs.equipment, costBreakdown.direct_costs.equipment / costBreakdown.grand_total]);
  
  worksheetData.push([]);
  
  // Indirect costs
  worksheetData.push([`Overhead, Contingency & Management (${indirectRates.ocm_percent}%)`, costBreakdown.indirect_costs.ocm, costBreakdown.indirect_costs.ocm / costBreakdown.grand_total]);
  worksheetData.push([`Contractor's Profit (${indirectRates.profit_percent}%)`, costBreakdown.indirect_costs.profit, costBreakdown.indirect_costs.profit / costBreakdown.grand_total]);
  worksheetData.push([`Taxes (${indirectRates.tax_percent}%)`, costBreakdown.indirect_costs.taxes, costBreakdown.indirect_costs.taxes / costBreakdown.grand_total]);
  
  worksheetData.push([]);
  
  // Grand total
  worksheetData.push(['GRAND TOTAL', costBreakdown.grand_total, 1.00]);
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  worksheet['!cols'] = [
    { width: 40 }, // Cost Type
    { width: 18 }, // Amount
    { width: 18 }  // % of Total Cost
  ];
  
  return worksheet;
};
