import React, { useState } from 'react';
import { Layout, Header, Main } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { ProjectBuilder } from '@/components/ProjectBuilder';
import { CsvManager } from '@/components/CsvManager';
import { Settings } from '@/components/Settings';
import { Project } from '@/types';

type ViewType = 'dashboard' | 'project-builder' | 'csv-manager' | 'settings';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const handleNavigate = (view: ViewType, data?: any) => {
    setCurrentView(view);
    if (view === 'project-builder' && data) {
      setCurrentProject(data);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      
      case 'project-builder':
        return currentProject ? (
          <ProjectBuilder
            project={currentProject}
            onProjectUpdate={setCurrentProject}
            onBack={() => handleNavigate('dashboard')}
          />
        ) : (
          <Dashboard onNavigate={handleNavigate} />
        );
      
      case 'csv-manager':
        return <CsvManager onBack={() => handleNavigate('dashboard')} />;
      
      case 'settings':
        return <Settings onBack={() => handleNavigate('dashboard')} />;
      
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout>
      <Header>
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => handleNavigate('dashboard')}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">POW</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Cost Builder</h1>
              <p className="text-xs text-muted-foreground -mt-1">
                Program of Works Estimation System
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-4">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavigate('csv-manager')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'csv-manager'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Database
            </button>
            <button
              onClick={() => handleNavigate('settings')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </Header>

      <Main>
        {renderCurrentView()}
      </Main>
    </Layout>
  );
};

export default Index;
