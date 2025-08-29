import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fileSystemManager, FileSystemManager } from '@/utils/fileSystem';
import { Project, ProjectItem, Item, IndirectCosts } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FileSystemContextType {
  isFileSystemEnabled: boolean;
  isInitialized: boolean;
  initializeFileSystem: () => Promise<boolean>;
  saveProject: (project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts) => Promise<void>;
  loadAllProjects: () => Promise<{ projects: Project[]; projectItems: ProjectItem[]; indirectCosts: IndirectCosts[] }>;
  saveDatabase: (items: Item[]) => Promise<void>;
  loadDatabase: () => Promise<Item[]>;
  exportProject: (project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts) => Promise<void>;
  importProject: () => Promise<{ project: Project; projectItems: ProjectItem[]; indirectCosts?: IndirectCosts } | null>;
  createBackup: () => Promise<void>;
  getBackupList: () => Promise<string[]>;
  restoreBackup: (backupDate: string) => Promise<boolean>;
  fileSystemManager: FileSystemManager;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

interface FileSystemProviderProps {
  children: ReactNode;
}

export const FileSystemProvider: React.FC<FileSystemProviderProps> = ({ children }) => {
  const [isFileSystemEnabled, setIsFileSystemEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize file system on component mount
  useEffect(() => {
    initializeFileSystem();
  }, []);

  const initializeFileSystem = async (): Promise<boolean> => {
    try {
      const success = await fileSystemManager.initialize();
      setIsFileSystemEnabled(success);
      setIsInitialized(true);
      
      if (success) {
        toast({
          title: "File System Enabled",
          description: "Projects will be automatically saved to your local folder.",
        });
      } else {
        toast({
          title: "Using Local Storage",
          description: "File system access not available. Using browser storage.",
          variant: "secondary",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error initializing file system:', error);
      setIsFileSystemEnabled(false);
      setIsInitialized(true);
      
      toast({
        title: "Storage Initialization Failed",
        description: "Using browser storage as fallback.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const saveProject = async (project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void> => {
    try {
      await fileSystemManager.saveProject(project, projectItems, indirectCosts);
      
      if (isFileSystemEnabled) {
        toast({
          title: "Project Saved",
          description: "Project has been saved to your local folder.",
        });
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const loadAllProjects = async (): Promise<{ projects: Project[]; projectItems: ProjectItem[]; indirectCosts: IndirectCosts[] }> => {
    try {
      const data = await fileSystemManager.loadAllProjects();
      
      if (isFileSystemEnabled && data.projects.length > 0) {
        toast({
          title: "Projects Loaded",
          description: `Loaded ${data.projects.length} projects from local folder.`,
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load projects. Using browser storage.",
        variant: "destructive",
      });
      
      // Return empty data as fallback
      return { projects: [], projectItems: [], indirectCosts: [] };
    }
  };

  const saveDatabase = async (items: Item[]): Promise<void> => {
    try {
      await fileSystemManager.saveDatabase(items);
      
      if (isFileSystemEnabled) {
        toast({
          title: "Database Saved",
          description: "Cost database has been saved to your local folder.",
        });
      }
    } catch (error) {
      console.error('Error saving database:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save database. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const loadDatabase = async (): Promise<Item[]> => {
    try {
      const items = await fileSystemManager.loadDatabase();
      
      if (isFileSystemEnabled && items.length > 0) {
        toast({
          title: "Database Loaded",
          description: `Loaded ${items.length} items from local folder.`,
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error loading database:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load database. Using browser storage.",
        variant: "destructive",
      });
      
      // Return empty array as fallback
      return [];
    }
  };

  const exportProject = async (project: Project, projectItems: ProjectItem[], indirectCosts?: IndirectCosts): Promise<void> => {
    try {
      await fileSystemManager.exportProject(project, projectItems, indirectCosts);
      toast({
        title: "Project Exported",
        description: "Project has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting project:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export project. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const importProject = async (): Promise<{ project: Project; projectItems: ProjectItem[]; indirectCosts?: IndirectCosts } | null> => {
    try {
      const data = await fileSystemManager.importProject();
      
      if (data) {
        toast({
          title: "Project Imported",
          description: "Project has been imported successfully.",
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error importing project:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import project. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const createBackup = async (): Promise<void> => {
    try {
      await fileSystemManager.createBackup();
      toast({
        title: "Backup Created",
        description: "Backup has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getBackupList = async (): Promise<string[]> => {
    try {
      const backups = await fileSystemManager.getBackupList();
      return backups;
    } catch (error) {
      console.error('Error getting backup list:', error);
      return [];
    }
  };

  const restoreBackup = async (backupDate: string): Promise<boolean> => {
    try {
      const success = await fileSystemManager.restoreBackup(backupDate);
      
      if (success) {
        toast({
          title: "Backup Restored",
          description: "Backup has been restored successfully.",
        });
      } else {
        toast({
          title: "Restore Failed",
          description: "Failed to restore backup. Please try again.",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore backup. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const value: FileSystemContextType = {
    isFileSystemEnabled,
    isInitialized,
    initializeFileSystem,
    saveProject,
    loadAllProjects,
    saveDatabase,
    loadDatabase,
    exportProject,
    importProject,
    createBackup,
    getBackupList,
    restoreBackup,
    fileSystemManager,
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = (): FileSystemContextType => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};
