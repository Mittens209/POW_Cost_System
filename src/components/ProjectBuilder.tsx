import React, { useState, useEffect } from 'react';
import { Project, ProjectItem, Item, CostBreakdown, CategorySubtotal, IndirectCosts } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { localStorageItems, localStorageProjectItems, localStorageIndirectCosts } from '@/utils/localStorage';
import { exportToExcel, ExcelExportData } from '@/utils/excelExport';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { ExcelIcon, DownloadIcon, ProjectIcon } from './Icons';

interface ProjectBuilderProps {
  project: Project;
  onProjectUpdate?: (project: Project) => void;
  onBack?: () => void;
}

export const ProjectBuilder: React.FC<ProjectBuilderProps> = ({ 
  project, 
  onProjectUpdate, 
  onBack 
}) => {
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [indirectCosts, setIndirectCosts] = useState<IndirectCosts>({
    id: 0,
    project_id: project.id,
    ocm_percent: 5.0,
    profit_percent: 8.0,
    tax_percent: 12.0,
  });
  const { toast } = useToast();
  const { isFileSystemEnabled, saveProject } = useFileSystem();

  useEffect(() => {
    loadProjectData();
    loadItems();
  }, [project.id]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const localProjectItems = localStorageProjectItems.getByProject(project.id);
      setProjectItems(localProjectItems);
      
      const localIndirectCosts = localStorageIndirectCosts.getByProject(project.id);
      if (localIndirectCosts) {
        setIndirectCosts(localIndirectCosts);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const localItems = localStorageItems.getAll();
      setItems(localItems);
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: "Error",
        description: "Failed to load items.",
        variant: "destructive",
      });
    }
  };

  const handleAddItemToProject = async () => {
    if (!selectedItem || !quantity || parseFloat(quantity) <= 0) return;

    try {
      const newProjectItem: Omit<ProjectItem, 'id' | 'total_cost'> = {
        project_id: project.id,
        item_id: selectedItem.id,
        quantity: parseFloat(quantity),
        unit_cost: selectedItem.unit_cost, // Snapshot current unit cost
        item_no: selectedItem.item_no,
        description: selectedItem.description,
        category: selectedItem.category,
        unit: selectedItem.unit,
        cost_type: selectedItem.cost_type,
      };

      const addedItem = localStorageProjectItems.add(newProjectItem);
      const updatedProjectItems = [...projectItems, addedItem];

      setProjectItems(updatedProjectItems);
      setShowAddItemDialog(false);
      setSelectedItem(null);
      setQuantity('1');
      
      // Auto-save to file system if enabled
      if (isFileSystemEnabled) {
        await saveProject(project, updatedProjectItems, indirectCosts);
      }
      
      toast({
        title: "Item added",
        description: `${addedItem.item_no} has been added to the project.`,
      });
    } catch (error) {
      console.error('Error adding item to project:', error);
      toast({
        title: "Error",
        description: "Failed to add item to project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProjectItem = async (id: number, updates: Partial<ProjectItem>) => {
    try {
      const updatedItem = localStorageProjectItems.update(id, updates);

      if (updatedItem) {
        const updatedProjectItems = projectItems.map(item => 
          item.id === id ? updatedItem : item
        );
        setProjectItems(updatedProjectItems);
        
        // Auto-save to file system if enabled
        if (isFileSystemEnabled) {
          await saveProject(project, updatedProjectItems, indirectCosts);
        }
      }
    } catch (error) {
      console.error('Error updating project item:', error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProjectItem = async (id: number) => {
    if (!confirm('Are you sure you want to remove this item from the project?')) return;
    
    try {
      localStorageProjectItems.delete(id);
      const updatedProjectItems = projectItems.filter(item => item.id !== id);
      setProjectItems(updatedProjectItems);
      
      // Auto-save to file system if enabled
      if (isFileSystemEnabled) {
        await saveProject(project, updatedProjectItems, indirectCosts);
      }
      
      toast({
        title: "Item removed",
        description: "Item has been removed from the project.",
      });
    } catch (error) {
      console.error('Error deleting project item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIndirectCostsUpdate = async (updates: Partial<IndirectCosts>) => {
    const updatedIndirectCosts = { ...indirectCosts, ...updates };
    setIndirectCosts(updatedIndirectCosts);
    
    try {
      localStorageIndirectCosts.upsert(updatedIndirectCosts);
      
      // Auto-save to file system if enabled
      if (isFileSystemEnabled) {
        await saveProject(project, projectItems, updatedIndirectCosts);
      }
    } catch (error) {
      console.error('Error updating indirect costs:', error);
      toast({
        title: "Error",
        description: "Failed to update indirect costs.",
        variant: "destructive",
      });
    }
  };

  const calculateCostBreakdown = (): CostBreakdown => {
    const directCosts = {
      material: projectItems
        .filter(item => item.cost_type === 'Material')
        .reduce((sum, item) => sum + item.total_cost, 0),
      labor: projectItems
        .filter(item => item.cost_type === 'Labor')
        .reduce((sum, item) => sum + item.total_cost, 0),
      equipment: projectItems
        .filter(item => item.cost_type === 'Equipment')
        .reduce((sum, item) => sum + item.total_cost, 0),
      total: 0,
    };
    
    directCosts.total = directCosts.material + directCosts.labor + directCosts.equipment;
    
    const ocm = directCosts.total * (indirectCosts.ocm_percent / 100);
    const profit = (directCosts.total + ocm) * (indirectCosts.profit_percent / 100);
    const taxes = (directCosts.total + ocm + profit) * (indirectCosts.tax_percent / 100);
    
    const indirectCostsTotal = {
      ocm,
      profit,
      taxes,
      total: ocm + profit + taxes,
    };
    
    return {
      direct_costs: directCosts,
      indirect_costs: indirectCostsTotal,
      grand_total: directCosts.total + indirectCostsTotal.total,
    };
  };

  const calculateCategorySubtotals = (): CategorySubtotal[] => {
    const costBreakdown = calculateCostBreakdown();
    const categoryTotals = projectItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0;
      }
      acc[item.category] += item.total_cost;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, subtotal]) => ({
      category,
      subtotal,
      percentage: (subtotal / costBreakdown.direct_costs.total) * 100,
    }));
  };

  const handleExportToExcel = () => {
    const costBreakdown = calculateCostBreakdown();
    const categorySubtotals = calculateCategorySubtotals();
    
    const exportData: ExcelExportData = {
      project,
      projectItems,
      costBreakdown,
      categorySubtotals,
      indirectRates: {
        ocm_percent: indirectCosts.ocm_percent,
        profit_percent: indirectCosts.profit_percent,
        tax_percent: indirectCosts.tax_percent,
      },
    };

    exportToExcel(exportData);
    
    toast({
      title: "Export successful",
      description: "Program of Works has been exported to Excel.",
    });
  };

  const filteredItems = items.filter(item =>
    item.item_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const costBreakdown = calculateCostBreakdown();
  const categorySubtotals = calculateCategorySubtotals();
  
  // Group project items by category for display
  const itemsByCategory = projectItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ProjectItem[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                ← Back
              </Button>
            )}
            <div>
              <CardTitle className="flex items-center gap-2">
                <ProjectIcon className="w-5 h-5" />
                {project.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {project.identification_no} • {project.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportToExcel} className="bg-primary hover:bg-primary-hover">
              <ExcelIcon className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Add Items */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Add Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="font-mono text-sm">{item.item_no}</div>
                  <div className="text-sm">{item.description}</div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    <span className="text-sm font-mono">
                      ₱{item.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedItem && (
              <div className="border-t pt-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Selected Item</Label>
                  <div className="p-2 bg-muted rounded text-sm">
                    <div className="font-mono">{selectedItem.item_no}</div>
                    <div>{selectedItem.description}</div>
                    <div className="text-muted-foreground">
                      ₱{selectedItem.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} / {selectedItem.unit}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAddItemToProject}
                  disabled={!selectedItem || !quantity || parseFloat(quantity) <= 0}
                  className="w-full"
                >
                  Add to Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Middle Panel - Project Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{category}</h3>
                    <Badge variant="secondary">
                      ₱{categoryItems.reduce((sum, item) => sum + item.total_cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{item.item_no}</span>
                              <Badge variant={
                                item.cost_type === 'Material' ? 'default' : 
                                item.cost_type === 'Labor' ? 'secondary' : 'outline'
                              } className="text-xs">
                                {item.cost_type}
                              </Badge>
                            </div>
                            <div className="text-sm">{item.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {((item.total_cost / costBreakdown.direct_costs.total) * 100).toFixed(2)}% of total direct cost
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.quantity}
                                onChange={(e) => handleUpdateProjectItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                className="w-20 h-8 text-center"
                              />
                              <div className="text-xs text-muted-foreground">{item.unit}</div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-mono text-sm">
                                ₱{item.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">unit cost</div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-semibold">
                                ₱{item.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">total</div>
                            </div>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProjectItem(item.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {projectItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Use the search panel to add items to your project.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Cost Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Direct Costs */}
            <div className="space-y-2">
              <h4 className="font-semibold">Direct Costs</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Materials:</span>
                  <span className="font-mono">₱{costBreakdown.direct_costs.material.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor:</span>
                  <span className="font-mono">₱{costBreakdown.direct_costs.labor.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipment:</span>
                  <span className="font-mono">₱{costBreakdown.direct_costs.equipment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Subtotal:</span>
                  <span className="font-mono">₱{costBreakdown.direct_costs.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Indirect Costs */}
            <div className="space-y-2">
              <h4 className="font-semibold">Indirect Costs</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">OCM %:</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={indirectCosts.ocm_percent}
                    onChange={(e) => handleIndirectCostsUpdate({ ocm_percent: parseFloat(e.target.value) || 0 })}
                    className="h-8 w-16 text-xs"
                  />
                  <span className="text-xs font-mono">
                    ₱{costBreakdown.indirect_costs.ocm.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Profit %:</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={indirectCosts.profit_percent}
                    onChange={(e) => handleIndirectCostsUpdate({ profit_percent: parseFloat(e.target.value) || 0 })}
                    className="h-8 w-16 text-xs"
                  />
                  <span className="text-xs font-mono">
                    ₱{costBreakdown.indirect_costs.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Tax %:</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={indirectCosts.tax_percent}
                    onChange={(e) => handleIndirectCostsUpdate({ tax_percent: parseFloat(e.target.value) || 0 })}
                    className="h-8 w-16 text-xs"
                  />
                  <span className="text-xs font-mono">
                    ₱{costBreakdown.indirect_costs.taxes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Subtotal:</span>
                  <span className="font-mono">₱{costBreakdown.indirect_costs.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total:</span>
                <span className="font-mono">₱{costBreakdown.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Direct: {((costBreakdown.direct_costs.total / costBreakdown.grand_total) * 100).toFixed(1)}% • 
                Indirect: {((costBreakdown.indirect_costs.total / costBreakdown.grand_total) * 100).toFixed(1)}%
              </div>
            </div>

            {/* Category Breakdown */}
            {categorySubtotals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Category Breakdown</h4>
                <div className="space-y-1">
                  {categorySubtotals.map((cs) => (
                    <div key={cs.category} className="flex justify-between text-xs">
                      <span className="truncate">{cs.category}:</span>
                      <span>{cs.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};