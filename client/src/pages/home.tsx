import { useState } from "react";
import { Link } from "wouter";
import { FileUpload } from "@/components/FileUpload";
import { ParsingStatus } from "@/components/ParsingStatus";
import { ProjectStructure } from "@/components/ProjectStructure";
import { UnrecognizedElements } from "@/components/UnrecognizedElements";
import { EditPanel } from "@/components/EditPanel";
import { GenerationControls } from "@/components/GenerationControls";
import { useQuery } from "@tanstack/react-query";
import type { ParsedProject } from "@shared/schema";

export default function Home() {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [parseProgress, setParseProgress] = useState<{
    currentStep: number;
    totalSteps: number;
    stepName: string;
    status: 'idle' | 'parsing' | 'completed' | 'error';
  }>({
    currentStep: 0,
    totalSteps: 4,
    stepName: 'Waiting for file...',
    status: 'idle',
  });

  const { data: projectData, refetch } = useQuery<ParsedProject & { fileTypeStats: Record<string, number> }>({
    queryKey: ['/api/projects', currentProjectId],
    enabled: !!currentProjectId,
  });

  const handleParseComplete = (projectId: string) => {
    setCurrentProjectId(projectId);
    setParseProgress({
      currentStep: 4,
      totalSteps: 4,
      stepName: 'Parsing completed',
      status: 'completed' as const,
    });
    refetch();
  };

  const handleParseProgress = (step: number, stepName: string, status: 'idle' | 'parsing' | 'completed' | 'error') => {
    setParseProgress({
      currentStep: step,
      totalSteps: 4,
      stepName,
      status: status as 'idle' | 'parsing' | 'completed' | 'error',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <i className="fas fa-wand-magic-sparkles text-xl"></i>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">PINpall</h1>
                  <p className="text-xs text-muted-foreground">Builder</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-3">
              <Link href="/settings">
                <button 
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-credit-card"></i>
                  Plans
                </button>
              </Link>
              <button 
                className="border border-primary/50 text-foreground px-4 py-2 rounded-md hover:bg-primary/10 transition-colors flex items-center gap-2"
              >
                <i className="fas fa-circle-question"></i>
                Help
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - File Upload & Parser */}
          <div className="lg:col-span-2 space-y-6">
            
            <FileUpload 
              onParseComplete={handleParseComplete}
              onParseProgress={handleParseProgress}
            />

            <ParsingStatus 
              progress={parseProgress}
            />

            {projectData && (
              <>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center" data-testid="parsing-results-title">
                      <i className="fas fa-chart-pie mr-3 text-primary text-xl"></i>
                      Results
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <div className="text-3xl font-bold text-primary" data-testid="stats-files-found">
                          {projectData.files.length}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                          <i className="fas fa-file-code"></i>
                          Files Found
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4 text-center hover:border-green-500/50 transition-colors">
                        <div className="text-3xl font-bold text-green-600" data-testid="stats-code-blocks">
                          {projectData.files.filter(f => f.content.trim()).length}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                          <i className="fas fa-code"></i>
                          Code Blocks
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-4 text-center hover:border-amber-500/50 transition-colors">
                        <div className="text-3xl font-bold text-amber-600" data-testid="stats-unrecognized">
                          {projectData.unrecognizedElements.length}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                          <i className="fas fa-circle-exclamation"></i>
                          Issues
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <i className="fas fa-tag text-primary"></i>
                        File Types
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(projectData.fileTypeStats).map(([ext, count]) => (
                          <span 
                            key={ext}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20 hover:border-primary/50 transition-colors"
                            data-testid={`file-type-${ext}`}
                          >
                            <i className="fas fa-circle text-xs mr-1"></i>
                            .{ext} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <EditPanel 
                  files={projectData.files}
                  onFileUpdate={refetch}
                />

                <GenerationControls 
                  project={projectData.project}
                />
              </>
            )}
          </div>

          {/* Right Column - Project Structure & Reports */}
          <div className="space-y-6">
            
            <ProjectStructure 
              files={projectData?.files || []}
              projectName={projectData?.project.name || ''}
            />

            <UnrecognizedElements 
              elements={projectData?.unrecognizedElements || []}
              onElementUpdate={refetch}
            />

            {/* Quick Actions */}
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <i className="fas fa-bolt mr-2 text-primary text-xl"></i>
                  Actions
                </h3>
                
                <div className="space-y-3">
                  <button 
                    className="w-full bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/50 text-foreground p-3 rounded-md text-left transition-colors group"
                    data-testid="button-load-example"
                  >
                    <div className="flex items-center">
                      <i className="fas fa-download mr-3 text-primary group-hover:scale-110 transition-transform"></i>
                      <div>
                        <div className="font-medium text-sm">Load Example</div>
                        <div className="text-xs text-muted-foreground">Sample transcript</div>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    className="w-full bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/50 text-foreground p-3 rounded-md text-left transition-colors group"
                    data-testid="button-project-history"
                  >
                    <div className="flex items-center">
                      <i className="fas fa-history mr-3 text-primary group-hover:scale-110 transition-transform"></i>
                      <div>
                        <div className="font-medium text-sm">History</div>
                        <div className="text-xs text-muted-foreground">Previous projects</div>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    className="w-full bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/50 text-foreground p-3 rounded-md text-left transition-colors group"
                    data-testid="button-parser-config"
                  >
                    <div className="flex items-center">
                      <i className="fas fa-sliders mr-3 text-primary group-hover:scale-110 transition-transform"></i>
                      <div>
                        <div className="font-medium text-sm">Config</div>
                        <div className="text-xs text-muted-foreground">Parser settings</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span data-testid="footer-copyright">© 2024 PINpall</span>
              <span data-testid="footer-version">v1.0.0</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="hover:text-primary transition-colors" data-testid="footer-docs">Docs</button>
              <button className="hover:text-primary transition-colors" data-testid="footer-support">Support</button>
              <button className="hover:text-primary transition-colors" data-testid="footer-github">GitHub</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
