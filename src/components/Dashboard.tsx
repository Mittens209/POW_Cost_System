import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { localStorageProjects, localStorageProjectItems, localStorageItems, localStorageIndirectCosts, localStorageSettings } from '@/utils/localStorage';
import { initializeSampleData } from '@/utils/sampleData';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { HeroIcon, ProjectIcon, DatabaseIcon, SettingsIcon } from './Icons';
import { FileSystemStatus } from './FileSystemStatus';
import * as XLSX from 'xlsx';

interface DashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { isFileSystemEnabled, saveProject, loadAllProjects, exportProject, importProject, createBackup, getBackupList, restoreBackup } = useFileSystem();
  
  // Export a single project and its items as JSON file
  const handleExportSingleProject = async (project: Project) => {
    try {
      // Get items for this project
      const allItems = localStorageProjectItems.getAll();
      const projectItems = allItems.filter(item => item.project_id === project.id);
      
      await exportProject(project, projectItems);
    } catch (error) {
      console.error('Error exporting project:', error);
    }
  };

  // Import a single project and its items from JSON file
  const handleImportSingleProject = async () => {
    try {
      const importedData = await importProject();
      if (importedData && importedData.project && importedData.projectItems) {
        // Save or update project
        const projects = localStorageProjects.getAll();
        const idx = projects.findIndex(p => p.id === importedData.project.id);
        if (idx >= 0) {
          projects[idx] = importedData.project;
        } else {
          projects.push(importedData.project);
        }
        localStorageProjects.save(projects);
        
        // Save project items (replace items for this project)
        let allItems = localStorageProjectItems.getAll();
        allItems = allItems.filter(item => item.project_id !== importedData.project.id);
        allItems = [...allItems, ...importedData.projectItems];
        localStorageProjectItems.save(allItems);
        
        // Save to file system if enabled
        if (isFileSystemEnabled) {
          await saveProject(importedData.project, importedData.projectItems, importedData.indirectCosts);
        }
        
        loadProjects();
      }
    } catch (error) {
      console.error('Error importing project:', error);
    }
  };
  // Ref for Import button
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Export projects as JSON file
  // Export projects and their items as JSON file
  const handleExportProjects = () => {
    const data = {
      projects: localStorageProjects.getAll(),
      projectItems: localStorageProjectItems.getAll(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Projects and items exported as projects.json.' });
  };

  // Import projects from JSON file
  // ...existing code...
  // Import projects and their items from JSON file
  const handleImportProjects = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.projects && Array.isArray(importedData.projects)) {
          localStorageProjects.save(importedData.projects);
        }
        if (importedData.projectItems && Array.isArray(importedData.projectItems)) {
          localStorageProjectItems.save(importedData.projectItems);
        }
        loadProjects();
        toast({ title: 'Imported', description: 'Projects and items imported successfully.' });
      } catch (err) {
        toast({ title: 'Error', description: 'Invalid file format.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const { toast } = useToast();
    // Data Management State
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    // Export all local data as JSON
    const handleExportData = () => {
      const data = {
        projects: localStorageProjects.getAll(),
        projectItems: localStorageProjectItems.getAll(),
        items: localStorageItems.getAll(),
        indirectCosts: localStorageIndirectCosts.getAll(),
        settings: localStorageSettings.get(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pow-cost-data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'Data exported as pow-cost-data.json.' });
  };

    // Reset all local data
    const handleResetData = () => {
      if (!confirm('Are you sure you want to reset all local data? This cannot be undone.')) return;
      localStorageProjects.save([]);
      localStorageProjectItems.save([]);
      localStorageItems.save([]);
      localStorageIndirectCosts.save([]);
      localStorageSettings.save({
        defaultOcmPercent: 5.0,
        defaultProfitPercent: 8.0,
        defaultTaxPercent: 12.0,
        currencySymbol: '₱',
        supabaseUrl: '',
        supabaseAnonKey: '',
      });
      loadProjects();
      toast({ title: 'Reset', description: 'All local data has been reset.' });
    };

  useEffect(() => {
    // Only initialize sample data if no projects exist
    if (localStorageProjects.getAll().length === 0) {
      initializeSampleData();
    }
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // Try to load from file system first if enabled
      if (isFileSystemEnabled) {
        const fileSystemData = await loadAllProjects();
        if (fileSystemData.projects.length > 0) {
          // Update localStorage with file system data
          localStorageProjects.save(fileSystemData.projects);
          localStorageProjectItems.save(fileSystemData.projectItems);
          fileSystemData.indirectCosts.forEach(ic => {
            const allIndirectCosts = localStorageIndirectCosts.getAll();
            const existingIndex = allIndirectCosts.findIndex(existing => existing.project_id === ic.project_id);
            if (existingIndex >= 0) {
              allIndirectCosts[existingIndex] = ic;
            } else {
              allIndirectCosts.push(ic);
            }
            localStorageIndirectCosts.save(allIndirectCosts);
          });
        }
      }

      // Fallback to localStorage
      if (localStorageProjects.getAll().length === 0) {
        // Initialize with sample data if no projects exist
        initializeSampleData();
      }
      
      const localProjects = localStorageProjects.getAll();
      setProjects(localProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProject = localStorageProjects.add(projectData);
      
      // Save to file system if enabled
      if (isFileSystemEnabled) {
        await saveProject(newProject, [], undefined);
      }
      
      setProjects(prev => [newProject, ...prev]);
      setShowNewProjectDialog(false);
      
      toast({
        title: "Project created",
        description: `${newProject.title} has been created successfully.`,
      });

      // Navigate to project builder
      onNavigate('project-builder', newProject);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    const duplicatedProject = {
      title: `${project.title} (Copy)`,
      location: project.location,
      category: project.category,
      identification_no: `${project.identification_no || 'COPY'}-${Date.now()}`,
      duration: project.duration,
      source_of_fund: project.source_of_fund,
    };

    await handleCreateProject(duplicatedProject);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      localStorageProjects.delete(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Program of Works</h1>
              <p className="text-lg text-muted-foreground mb-4">
                Professional cost estimation system for construction projects
              </p>
              <div className="flex items-center gap-2 text-sm">
                <FileSystemStatus />
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{projects.length} projects</span>
                <span className="text-muted-foreground">•</span>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleImportSingleProject}
                />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="ml-2">Import Project</Button>
              </div>
            </div>
            <div className="hidden md:block">
              <HeroIcon className="w-48 h-32" />
            </div>
          </div>
        </CardContent>
      </Card>

  {/* Import Dialog removed as per request to remove import/export/reset features */}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <ProjectIcon className="w-8 h-8 mb-2 text-primary" />
                <h3 className="font-semibold">New Project</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Create a new cost estimation project
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new cost estimation project.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <NewProjectForm onSubmit={handleCreateProject} />
            </div>
          </DialogContent>
        </Dialog>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('csv-manager')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <DatabaseIcon className="w-8 h-8 mb-2 text-primary" />
            <h3 className="font-semibold">Cost Database</h3>
            <p className="text-sm text-muted-foreground text-center">
              Manage items and unit costs
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('settings')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <SettingsIcon className="w-8 h-8 mb-2 text-primary" />
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-muted-foreground text-center">
              Configure defaults and preferences
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-primary mb-1">
              {projects.length}
            </div>
            <h3 className="font-semibold">Total Projects</h3>
            <p className="text-sm text-muted-foreground text-center">
              Active cost estimations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <ProjectIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={() => setShowNewProjectDialog(true)}>
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold truncate">{project.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.identification_no}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {project.category || 'General'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      {project.location && (
                        <div className="truncate">📍 {project.location}</div>
                      )}
                      {project.duration && (
                        <div>⏱️ {project.duration}</div>
                      )}
                      <div>📅 {new Date(project.updated_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => onNavigate('project-builder', project)}
                        className="flex-1"
                      >
                        Open
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDuplicateProject(project)}
                      >
                        Duplicate
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        Delete
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportSingleProject(project)}
                      >
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// New Project Form Component
const NewProjectForm: React.FC<{
  onSubmit: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
}> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    category: '',
    identification_no: '',
    duration: '',
    source_of_fund: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Project Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Residential Building Construction"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="identification_no">Project ID</Label>
          <Input
            id="identification_no"
            value={formData.identification_no}
            onChange={(e) => setFormData(prev => ({ ...prev, identification_no: e.target.value }))}
            placeholder="e.g., RES-2024-001"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., Residential, Commercial"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="e.g., Quezon City"
        />
      </div>
      <div>
        <Label htmlFor="duration">Duration</Label>
        <Input
          id="duration"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
          placeholder="e.g., 6 months"
        />
      </div>
      <div>
        <Label htmlFor="source_of_fund">Source of Fund</Label>
        <Input
          id="source_of_fund"
          value={formData.source_of_fund}
          onChange={(e) => setFormData(prev => ({ ...prev, source_of_fund: e.target.value }))}
          placeholder="e.g., Private, Government"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">Create Project</Button>
      </div>
    </form>
  );
};