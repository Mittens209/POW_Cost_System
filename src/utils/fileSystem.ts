import { Project, ProjectItem, Item, IndirectCosts } from '@/types';

// File System Access API wrapper
export interface FileSystemManager {
  initialize(): Promise<boolean>;
  saveProject(project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void>;
  loadAllProjects(): Promise<{ projects: Project[]; projectItems: ProjectItem[]; indirectCosts: IndirectCosts[] }>;
  saveDatabase(items: Item[]): Promise<void>;
  loadDatabase(): Promise<Item[]>;
  exportProject(project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void>;
  importProject(): Promise<{ project: Project; projectItems: ProjectItem[]; indirectCosts?: IndirectCosts } | null>;
  createBackup(): Promise<void>;
  getBackupList(): Promise<string[]>;
  restoreBackup(backupDate: string): Promise<boolean>;
}

// Check if File System Access API is supported
const isFileSystemSupported = () => {
  return 'showDirectoryPicker' in window && 'showSaveFilePicker' in window;
};

// Fallback to localStorage if File System Access API is not supported
class LocalStorageFallback implements FileSystemManager {
  async initialize(): Promise<boolean> {
    return true; // Always available
  }

  async saveProject(project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void> {
    // Save to localStorage (existing functionality preserved)
    const projects = JSON.parse(localStorage.getItem('pow_cost_projects') || '[]');
    const existingIndex = projects.findIndex((p: Project) => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem('pow_cost_projects', JSON.stringify(projects));

    // Save project items
    const allProjectItems = JSON.parse(localStorage.getItem('pow_cost_project_items') || '[]');
    const filteredItems = allProjectItems.filter((item: ProjectItem) => item.project_id !== project.id);
    const updatedItems = [...filteredItems, ...projectItems];
    localStorage.setItem('pow_cost_project_items', JSON.stringify(updatedItems));

    // Save indirect costs if provided
    if (indirectCosts) {
      const allIndirectCosts = JSON.parse(localStorage.getItem('pow_cost_indirect_costs') || '[]');
      const existingIndirectIndex = allIndirectCosts.findIndex((ic: IndirectCosts) => ic.project_id === project.id);
      
      if (existingIndirectIndex >= 0) {
        allIndirectCosts[existingIndirectIndex] = indirectCosts;
      } else {
        allIndirectCosts.push(indirectCosts);
      }
      localStorage.setItem('pow_cost_indirect_costs', JSON.stringify(allIndirectCosts));
    }
  }

  async loadAllProjects(): Promise<{ projects: Project[]; projectItems: ProjectItem[]; indirectCosts: IndirectCosts[] }> {
    const projects = JSON.parse(localStorage.getItem('pow_cost_projects') || '[]');
    const projectItems = JSON.parse(localStorage.getItem('pow_cost_project_items') || '[]');
    const indirectCosts = JSON.parse(localStorage.getItem('pow_cost_indirect_costs') || '[]');
    
    return { projects, projectItems, indirectCosts };
  }

  async saveDatabase(items: Item[]): Promise<void> {
    localStorage.setItem('pow_cost_items', JSON.stringify(items));
  }

  async loadDatabase(): Promise<Item[]> {
    return JSON.parse(localStorage.getItem('pow_cost_items') || '[]');
  }

  async exportProject(project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void> {
    const data = { project, projectItems, indirectCosts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_') || 'project'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async importProject(): Promise<{ project: Project; projectItems: ProjectItem[]; indirectCosts?: IndirectCosts } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            resolve(data);
          } catch (error) {
            console.error('Error parsing import file:', error);
            resolve(null);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  async createBackup(): Promise<void> {
    const data = {
      projects: JSON.parse(localStorage.getItem('pow_cost_projects') || '[]'),
      projectItems: JSON.parse(localStorage.getItem('pow_cost_project_items') || '[]'),
      items: JSON.parse(localStorage.getItem('pow_cost_items') || '[]'),
      indirectCosts: JSON.parse(localStorage.getItem('pow_cost_indirect_costs') || '[]'),
      settings: JSON.parse(localStorage.getItem('pow_cost_settings') || '{}'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pow-cost-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async getBackupList(): Promise<string[]> {
    return []; // No backup list in localStorage fallback
  }

  async restoreBackup(backupDate: string): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(false);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.projects) localStorage.setItem('pow_cost_projects', JSON.stringify(data.projects));
            if (data.projectItems) localStorage.setItem('pow_cost_project_items', JSON.stringify(data.projectItems));
            if (data.items) localStorage.setItem('pow_cost_items', JSON.stringify(data.items));
            if (data.indirectCosts) localStorage.setItem('pow_cost_indirect_costs', JSON.stringify(data.indirectCosts));
            if (data.settings) localStorage.setItem('pow_cost_settings', JSON.stringify(data.settings));
            resolve(true);
          } catch (error) {
            console.error('Error restoring backup:', error);
            resolve(false);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }
}

// File System Access API implementation
class FileSystemAccess implements FileSystemManager {
  private rootHandle: FileSystemDirectoryHandle | null = null;
  private projectsHandle: FileSystemDirectoryHandle | null = null;
  private databaseHandle: FileSystemDirectoryHandle | null = null;
  private backupsHandle: FileSystemDirectoryHandle | null = null;

  async initialize(): Promise<boolean> {
    try {
      if (!isFileSystemSupported()) {
        console.warn('File System Access API not supported, falling back to localStorage');
        return false;
      }

      // Try to get existing directory or create new one
      try {
        this.rootHandle = await window.showDirectoryPicker({
          id: 'pow-cost-builder',
          mode: 'readwrite',
          startIn: 'documents'
        });
      } catch (error) {
        // User denied permission or cancelled
        console.warn('File system access denied:', error);
        return false;
      }

      // Create folder structure
      this.projectsHandle = await this.getOrCreateDirectory(this.rootHandle, 'Projects');
      this.databaseHandle = await this.getOrCreateDirectory(this.rootHandle, 'Database');
      this.backupsHandle = await this.getOrCreateDirectory(this.rootHandle, 'Backups');

      return true;
    } catch (error) {
      console.error('Error initializing file system:', error);
      return false;
    }
  }

  private async getOrCreateDirectory(parent: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle> {
    try {
      return await parent.getDirectoryHandle(name, { create: true });
    } catch (error) {
      console.error(`Error creating directory ${name}:`, error);
      throw error;
    }
  }

  async saveProject(project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void> {
    if (!this.projectsHandle) throw new Error('File system not initialized');

    try {
      const projectData = {
        project,
        projectItems,
        indirectCosts,
        lastModified: new Date().toISOString()
      };

      const fileName = `project_${project.id}.json`;
      const fileHandle = await this.projectsHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(projectData, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error saving project to file:', error);
      throw error;
    }
  }

  async loadAllProjects(): Promise<{ projects: Project[]; projectItems: ProjectItem[]; indirectCosts: IndirectCosts[] }> {
    if (!this.projectsHandle) throw new Error('File system not initialized');

    const projects: Project[] = [];
    const projectItems: ProjectItem[] = [];
    const indirectCosts: IndirectCosts[] = [];

    try {
      for await (const entry of this.projectsHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          try {
            const file = await entry.getFile();
            const content = await file.text();
            const data = JSON.parse(content);
            
            if (data.project) projects.push(data.project);
            if (data.projectItems) projectItems.push(...data.projectItems);
            if (data.indirectCosts) indirectCosts.push(data.indirectCosts);
          } catch (error) {
            console.error(`Error loading project file ${entry.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading projects from file system:', error);
    }

    return { projects, projectItems, indirectCosts };
  }

  async saveDatabase(items: Item[]): Promise<void> {
    if (!this.databaseHandle) throw new Error('File system not initialized');

    try {
      const fileHandle = await this.databaseHandle.getFileHandle('cost_items.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(items, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error saving database to file:', error);
      throw error;
    }
  }

  async loadDatabase(): Promise<Item[]> {
    if (!this.databaseHandle) throw new Error('File system not initialized');

    try {
      const fileHandle = await this.databaseHandle.getFileHandle('cost_items.json');
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading database from file:', error);
      return [];
    }
  }

  async exportProject(project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void> {
    const data = { project, projectItems, indirectCosts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_') || 'project'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async importProject(): Promise<{ project: Project; projectItems: ProjectItem[]; indirectCosts?: IndirectCosts } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            resolve(data);
          } catch (error) {
            console.error('Error parsing import file:', error);
            resolve(null);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  async createBackup(): Promise<void> {
    if (!this.backupsHandle) throw new Error('File system not initialized');

    try {
      const today = new Date().toISOString().split('T')[0];
      const backupDir = await this.getOrCreateDirectory(this.backupsHandle, today);
      
      const data = {
        projects: await this.loadAllProjects(),
        items: await this.loadDatabase(),
        timestamp: new Date().toISOString()
      };

      const fileHandle = await backupDir.getFileHandle(`backup_${Date.now()}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async getBackupList(): Promise<string[]> {
    if (!this.backupsHandle) return [];

    const backups: string[] = [];
    try {
      for await (const entry of this.backupsHandle.values()) {
        if (entry.kind === 'directory') {
          backups.push(entry.name);
        }
      }
    } catch (error) {
      console.error('Error getting backup list:', error);
    }
    return backups.sort().reverse();
  }

  async restoreBackup(backupDate: string): Promise<boolean> {
    if (!this.backupsHandle) return false;

    try {
      const backupDir = await this.backupsHandle.getDirectoryHandle(backupDate);
      const files: File[] = [];
      
      for await (const entry of backupDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          const file = await entry.getFile();
          files.push(file);
        }
      }

      if (files.length === 0) return false;

      // Use the most recent backup file
      const latestFile = files.sort((a, b) => b.lastModified - a.lastModified)[0];
      const content = await latestFile.text();
      const data = JSON.parse(content);

      // Restore data
      if (data.projects) {
        await this.saveProject(data.projects.project, data.projects.projectItems, data.projects.indirectCosts);
      }
      if (data.items) {
        await this.saveDatabase(data.items);
      }

      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }
}

// Factory function to create appropriate file system manager
export const createFileSystemManager = (): FileSystemManager => {
  if (isFileSystemSupported()) {
    return new FileSystemAccess();
  } else {
    return new LocalStorageFallback();
  }
};

// Global file system manager instance
export const fileSystemManager = createFileSystemManager();
