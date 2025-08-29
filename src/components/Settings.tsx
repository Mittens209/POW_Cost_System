import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { localStorageSettings, AppSettings } from '@/utils/localStorage';
import { SettingsIcon } from './Icons';

interface SettingsProps {
  onBack?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings>(localStorageSettings.get());
  const { toast } = useToast();

  const handleSave = () => {
    localStorageSettings.save(settings);
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully.",
    });
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      defaultOcmPercent: 5.0,
      defaultProfitPercent: 8.0,
      defaultTaxPercent: 12.0,
      currencySymbol: '₱',
      supabaseUrl: '',
      supabaseAnonKey: '',
    };
    setSettings(defaultSettings);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pow_settings_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Settings exported",
      description: "Settings file has been downloaded.",
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...settings, ...importedSettings });
        toast({
          title: "Settings imported",
          description: "Settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import error",
          description: "Invalid settings file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

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
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Settings & Configuration
            </CardTitle>
          </div>
                      <Badge variant="secondary">
              Local Mode
            </Badge>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Percentages */}
        <Card>
          <CardHeader>
            <CardTitle>Default Cost Percentages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ocm_percent">Overhead, Contingency & Management (%)</Label>
              <Input
                id="ocm_percent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.defaultOcmPercent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultOcmPercent: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Applied to direct costs to calculate overhead and management fees
              </p>
            </div>

            <div>
              <Label htmlFor="profit_percent">Contractor's Profit (%)</Label>
              <Input
                id="profit_percent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.defaultProfitPercent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultProfitPercent: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Applied to direct costs + OCM to calculate contractor profit
              </p>
            </div>

            <div>
              <Label htmlFor="tax_percent">Taxes (%)</Label>
              <Input
                id="tax_percent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.defaultTaxPercent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultTaxPercent: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Applied to direct costs + OCM + profit to calculate final taxes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency_symbol">Currency Symbol</Label>
              <Input
                id="currency_symbol"
                value={settings.currencySymbol}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  currencySymbol: e.target.value 
                }))}
                placeholder="₱"
                maxLength={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Symbol displayed before monetary amounts
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">Sample cost display:</div>
                <div className="font-mono text-lg">
                  {settings.currencySymbol}1,234,567.89
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="supabase_url">Supabase URL</Label>
              <Input
                id="supabase_url"
                type="url"
                value={settings.supabaseUrl}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  supabaseUrl: e.target.value 
                }))}
                placeholder="https://your-project.supabase.co"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Your Supabase project URL for cloud storage
              </p>
            </div>

            <div>
              <Label htmlFor="supabase_anon_key">Supabase Anon Key</Label>
              <Input
                id="supabase_anon_key"
                type="password"
                value={settings.supabaseAnonKey}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  supabaseAnonKey: e.target.value 
                }))}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Your Supabase anonymous key (public key)
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">How to get Supabase credentials:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to Settings → API</li>
                <li>Copy the "Project URL" and "anon public" key</li>
                <li>Paste them into the fields above</li>
              </ol>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm">
                Using local storage
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Import/Export Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Backup & Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Export Settings</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Download your current settings as a JSON file
              </p>
              <Button variant="outline" onClick={exportSettings} className="w-full">
                Export Settings
              </Button>
            </div>

            <div>
              <Label>Import Settings</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a previously exported settings file
              </p>
              <Button variant="outline" asChild className="w-full">
                <label>
                  Import Settings
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>

            <div className="border-t pt-4">
              <Label>Reset to Defaults</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Restore all settings to their default values
              </p>
              <Button variant="destructive" onClick={handleReset} className="w-full">
                Reset Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>

      {/* Information Panel */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">About This System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <strong>POW Cost Builder</strong> - Professional Program of Works cost estimation system
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Features:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Cost database management</li>
                <li>Project-based estimation</li>
                <li>Excel export (POW format)</li>
                <li>Cloud storage integration</li>
              </ul>
            </div>
            <div>
              <strong>Storage Options:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Local browser storage</li>
                <li>Supabase cloud database</li>
                <li>CSV import/export</li>
                <li>Automatic synchronization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};