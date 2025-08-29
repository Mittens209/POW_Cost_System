import React, { useState, useEffect } from 'react';
import { Item } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { localStorageItems } from '@/utils/localStorage';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { DatabaseIcon, UploadIcon, DownloadIcon } from './Icons';

interface CsvManagerProps {
  onItemsChange?: (items: Item[]) => void;
  onBack?: () => void;
}

export const CsvManager: React.FC<CsvManagerProps> = ({ onItemsChange, onBack }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Omit<Item, 'id' | 'date_added'>[]>([]);
  const { toast } = useToast();
  const { isFileSystemEnabled, saveDatabase } = useFileSystem();

  const costTypes = ['Material', 'Labor', 'Equipment'] as const;
  const categories = [
    'Site Works', 'Structural Works', 'Architectural Works', 
    'Mechanical Works', 'Electrical Works', 'Plumbing Works',
    'General Requirements', 'Miscellaneous'
  ];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const localItems = localStorageItems.getAll();
      setItems(localItems);
      onItemsChange?.(localItems);
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: "Error",
        description: "Failed to load items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData: Omit<Item, 'id' | 'date_added'>) => {
    try {
      const newItem = localStorageItems.add(itemData);
      
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      onItemsChange?.(updatedItems);
      setShowAddDialog(false);
      
      // Auto-save to file system if enabled
      if (isFileSystemEnabled) {
        await saveDatabase(updatedItems);
      }
      
      toast({
        title: "Item added",
        description: `${newItem.item_no} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (id: number, updates: Partial<Item>) => {
    try {
      const updatedItem = localStorageItems.update(id, updates);

      if (updatedItem) {
        const updatedItems = items.map(item => 
          item.id === id ? updatedItem : item
        );
        setItems(updatedItems);
        onItemsChange?.(updatedItems);
        setEditingItem(null);
        
        // Auto-save to file system if enabled
        if (isFileSystemEnabled) {
          await saveDatabase(updatedItems);
        }
        
        toast({
          title: "Item updated",
          description: "Item has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      localStorageItems.delete(id);
      
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);
      onItemsChange?.(updatedItems);
      
      // Auto-save to file system if enabled
      if (isFileSystemEnabled) {
        await saveDatabase(updatedItems);
      }
      
      toast({
        title: "Item deleted",
        description: "Item has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToCsv = () => {
    const headers = ['item_no', 'description', 'category', 'subcategory', 'unit', 'unit_cost', 'cost_type', 'date_added'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        item.item_no,
        `"${item.description.replace(/"/g, '""')}"`,
        item.category,
        item.subcategory || '',
        item.unit,
        item.unit_cost.toString(),
        item.cost_type,
        item.date_added
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cost_database_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "CSV file has been downloaded.",
    });
  };

  const handleImportCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const importedItems = lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const item: Omit<Item, 'id' | 'date_added'> = {
            item_no: values[0] || `IMP-${index + 1}`,
            description: values[1] || 'Imported Item',
            category: values[2] || 'Miscellaneous',
            subcategory: values[3] || undefined,
            unit: values[4] || 'ea',
            unit_cost: parseFloat(values[5]) || 0,
            cost_type: (values[6] as any) || 'Material',
          };
          return item;
        });

      // Check if there are existing items
      if (items.length > 0) {
        // Show warning dialog
        setPendingImportData(importedItems);
        setShowImportWarning(true);
      } else {
        // No existing items, proceed with import
        processImport(importedItems, false);
      }
    };
    reader.readAsText(file);
  };

  const processImport = async (importedItems: Omit<Item, 'id' | 'date_added'>[], clearExisting: boolean) => {
    try {
      if (clearExisting) {
        // Clear all existing items
        localStorageItems.save([]);
        setItems([]);
        onItemsChange?.([]);
      }

      // Add imported items
      const newItems: Item[] = [];
      importedItems.forEach(item => {
        const newItem = localStorageItems.add(item);
        newItems.push(newItem);
      });

      // Update state
      const updatedItems = clearExisting ? newItems : [...items, ...newItems];
      setItems(updatedItems);
      onItemsChange?.(updatedItems);
      
      // Auto-save to file system if enabled
      if (isFileSystemEnabled) {
        await saveDatabase(updatedItems);
      }
      
      toast({
        title: "Import successful",
        description: `${clearExisting ? 'Replaced' : 'Added'} ${importedItems.length} items.`,
      });
    } catch (error) {
      console.error('Error processing import:', error);
      toast({
        title: "Error",
        description: "Failed to import items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportConfirm = (clearExisting: boolean) => {
    processImport(pendingImportData, clearExisting);
    setShowImportWarning(false);
    setPendingImportData([]);
  };

  const filteredItems = items.filter(item =>
    item.item_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                ← Back
              </Button>
            )}
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5" />
              Cost Database Manager
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Local Storage
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search items by number, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            <div className="flex gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>Add Item</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                  </DialogHeader>
                  <AddItemForm onSubmit={handleAddItem} categories={categories} />
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={exportToCsv}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              
              <Button variant="outline" asChild>
                <label>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCsv}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-table-header">
                  <tr>
                    <th className="p-3 text-left font-medium">Item No.</th>
                    <th className="p-3 text-left font-medium">Description</th>
                    <th className="p-3 text-left font-medium">Category</th>
                    <th className="p-3 text-left font-medium">Unit</th>
                    <th className="p-3 text-right font-medium">Unit Cost</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-table-row-hover">
                      <td className="p-3 font-mono text-sm">{item.item_no}</td>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-3">{item.unit}</td>
                      <td className="p-3 text-right font-mono">
                        ₱{item.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <Badge variant={
                          item.cost_type === 'Material' ? 'default' : 
                          item.cost_type === 'Labor' ? 'secondary' : 'outline'
                        }>
                          {item.cost_type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? 'Loading items...' : 'No items found. Add some items to get started.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <EditItemForm 
              item={editingItem} 
              onSubmit={(updates) => handleUpdateItem(editingItem.id, updates)}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Warning Dialog */}
      <Dialog open={showImportWarning} onOpenChange={setShowImportWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ Import Warning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>You are about to import <strong>{pendingImportData.length} items</strong> from your CSV file.</p>
              <p className="mt-2">Currently, you have <strong>{items.length} existing items</strong> in your database.</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-lg">⚠️</div>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">Choose how to handle existing data:</p>
                  <ul className="text-yellow-700 space-y-1">
                    <li>• <strong>Add to existing:</strong> New items will be added alongside current items</li>
                    <li>• <strong>Replace all:</strong> All existing items will be deleted and replaced with new data</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportWarning(false);
                  setPendingImportData([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleImportConfirm(false)}
              >
                Add to Existing
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleImportConfirm(true)}
              >
                Replace All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Item Form Component
const AddItemForm: React.FC<{
  onSubmit: (item: Omit<Item, 'id' | 'date_added'>) => void;
  categories: string[];
}> = ({ onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    item_no: '',
    description: '',
    category: '',
    subcategory: '',
    unit: '',
    unit_cost: '',
    cost_type: 'Material' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      unit_cost: parseFloat(formData.unit_cost) || 0,
      subcategory: formData.subcategory || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="item_no">Item Number</Label>
          <Input
            id="item_no"
            value={formData.item_no}
            onChange={(e) => setFormData(prev => ({ ...prev, item_no: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            placeholder="ea, m², kg, etc."
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="cost_type">Cost Type</Label>
          <Select 
            value={formData.cost_type} 
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, cost_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Material">Material</SelectItem>
              <SelectItem value="Labor">Labor</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subcategory">Subcategory (Optional)</Label>
          <Input
            id="subcategory"
            value={formData.subcategory}
            onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="unit_cost">Unit Cost (₱)</Label>
          <Input
            id="unit_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_cost}
            onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Add Item</Button>
      </div>
    </form>
  );
};

// Edit Item Form Component
const EditItemForm: React.FC<{
  item: Item;
  onSubmit: (updates: Partial<Item>) => void;
  categories: string[];
}> = ({ item, onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    item_no: item.item_no,
    description: item.description,
    category: item.category,
    subcategory: item.subcategory || '',
    unit: item.unit,
    unit_cost: item.unit_cost.toString(),
    cost_type: item.cost_type,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      unit_cost: parseFloat(formData.unit_cost) || 0,
      subcategory: formData.subcategory || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit_item_no">Item Number</Label>
          <Input
            id="edit_item_no"
            value={formData.item_no}
            onChange={(e) => setFormData(prev => ({ ...prev, item_no: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit_unit">Unit</Label>
          <Input
            id="edit_unit"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="edit_description">Description</Label>
        <Input
          id="edit_description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit_category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit_cost_type">Cost Type</Label>
          <Select 
            value={formData.cost_type} 
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, cost_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Material">Material</SelectItem>
              <SelectItem value="Labor">Labor</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit_subcategory">Subcategory</Label>
          <Input
            id="edit_subcategory"
            value={formData.subcategory}
            onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="edit_unit_cost">Unit Cost (₱)</Label>
          <Input
            id="edit_unit_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_cost}
            onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Update Item</Button>
      </div>
    </form>
  );
};