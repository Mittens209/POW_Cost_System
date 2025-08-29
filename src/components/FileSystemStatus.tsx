import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { FolderIcon, CloudIcon, HardDriveIcon } from './Icons';

export const FileSystemStatus: React.FC = () => {
  const { 
    isFileSystemEnabled, 
    isInitialized, 
    createBackup, 
    getBackupList, 
    restoreBackup 
  } = useFileSystem();
  
  const [backupList, setBackupList] = useState<string[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await createBackup();
      // Refresh backup list
      const backups = await getBackupList();
      setBackupList(backups);
    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    setLoading(true);
    try {
      const success = await restoreBackup(selectedBackup);
      if (success) {
        setShowBackupDialog(false);
        setSelectedBackup('');
        // Reload the page to reflect restored data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBackupList = async () => {
    try {
      const backups = await getBackupList();
      setBackupList(backups);
    } catch (error) {
      console.error('Error loading backup list:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Initializing...</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isFileSystemEnabled ? "default" : "secondary"}>
        {isFileSystemEnabled ? (
          <>
            <FolderIcon className="w-3 h-3 mr-1" />
            Local Files
          </>
        ) : (
          <>
            <HardDriveIcon className="w-3 h-3 mr-1" />
            Browser Storage
          </>
        )}
      </Badge>

      {isFileSystemEnabled && (
        <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadBackupList}
            >
              <CloudIcon className="w-3 h-3 mr-1" />
              Backup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Backup & Restore</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Button 
                  onClick={handleCreateBackup} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create New Backup'}
                </Button>
              </div>

              {backupList.length > 0 && (
                <div className="space-y-2">
                  <Label>Restore from Backup:</Label>
                  <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a backup date" />
                    </SelectTrigger>
                    <SelectContent>
                      {backupList.map((backup) => (
                        <SelectItem key={backup} value={backup}>
                          {backup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleRestoreBackup}
                    disabled={!selectedBackup || loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? 'Restoring...' : 'Restore Backup'}
                  </Button>
                </div>
              )}

              {backupList.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No backups available
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
