import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ClientChatParser } from "@/lib/chatParser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ParsedProject } from "@shared/schema";

interface FileUploadProps {
  onParseComplete: (projectId: string) => void;
  onParseProgress: (step: number, stepName: string, status: 'idle' | 'parsing' | 'completed' | 'error') => void;
}

export function FileUpload({ onParseComplete, onParseProgress }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [sourceType, setSourceType] = useState<'chatgpt' | 'grok' | 'deepseek' | 'claude'>('grok');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedExtensions = ['.md', '.txt'];
    const isValidType = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Only .md and .txt files are supported",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
  };

  const queryClient = useQueryClient();

  const handleUploadFile = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    onParseProgress(1, 'Loading file...', 'parsing');

    try {
      const fileSize = uploadedFile.size;
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, "");
      const isSmallFile = fileSize < 5 * 1024 * 1024; // 5MB threshold

      if (isSmallFile) {
        // CLIENT-SIDE PARSING (works 100% offline!)
        onParseProgress(2, 'Parsing locally in browser...', 'parsing');
        
        const fileContent = await uploadedFile.text();
        const parser = new ClientChatParser(fileContent);
        const parsed = parser.parse();

        onParseProgress(3, 'Building project structure...', 'parsing');

        // Create project data locally
        const projectId = Math.random().toString(36).substr(2, 9);
        const fileTypeStats: Record<string, number> = {};

        const projectData: ParsedProject & { fileTypeStats: Record<string, number> } = {
          project: {
            id: projectId,
            name: fileName,
            originalFileName: uploadedFile.name,
            fileSize: fileSize,
            parseStatus: 'completed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          files: parsed.files.map(f => {
            const ext = f.path.split('.').pop() || 'unknown';
            fileTypeStats[ext] = (fileTypeStats[ext] || 0) + 1;
            return {
              id: Math.random().toString(36).substr(2, 9),
              projectId: projectId,
              filePath: f.path,
              content: f.content,
              fileType: f.type,
              language: f.language || null,
              lineCount: f.content.split('\n').length,
              isGenerated: true,
            };
          }),
          unrecognizedElements: parsed.unrecognizedBlocks.map(ub => ({
            id: Math.random().toString(36).substr(2, 9),
            projectId: projectId,
            content: ub.content,
            context: ub.context || null,
            lineNumber: ub.lineNumber || null,
            suggestedType: ub.suggestedType || null,
            resolved: false,
          })),
          fileTypeStats: fileTypeStats
        };

        // Store in cache
        queryClient.setQueryData(['/api/projects', projectId], projectData);

        onParseProgress(4, 'Done! (Offline parsing)', 'completed');
        
        setTimeout(() => {
          onParseComplete(projectId);
          toast({
            title: "✅ Parsing completed (offline)",
            description: `Found ${parsed.files.length} files offline in your browser!`,
          });
        }, 500);
      } else {
        // SERVER-SIDE PARSING (for large files)
        onParseProgress(2, 'Uploading to server...', 'parsing');
        
        const formData = new FormData();
        formData.append('chatFile', uploadedFile);
        formData.append('projectName', fileName);

        const response = await fetch('/api/parse-chat', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload error');
        }

        const result = await response.json();
        onParseProgress(3, 'Parsing on server...', 'parsing');
        
        setTimeout(() => {
          onParseProgress(4, 'Done! (Server parsing)', 'completed');
          setTimeout(() => {
            onParseComplete(result.projectId);
            toast({
              title: "✅ Parsing completed (server)",
              description: `Found ${result.filesFound} files using server parser`,
            });
          }, 500);
        }, 1000);
      }
    } catch (error) {
      onParseProgress(0, 'Parsing error', 'error');
      toast({
        title: "❌ Parsing error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportURL = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please paste a chat URL",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    onParseProgress(1, 'Downloading chat from link...', 'parsing');

    try {
      onParseProgress(2, 'Parsing project structure...', 'parsing');
      
      const response = await fetch('/api/import-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          source: sourceType,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();

      onParseProgress(3, 'Validating completeness...', 'parsing');
      
      setTimeout(() => {
        onParseProgress(4, 'Done!', 'completed');
        setTimeout(() => {
          onParseComplete(result.projectId);
          toast({
            title: "✅ Import completed",
            description: `Found ${result.filesFound} files from chat`,
          });
          setUrlInput('');
        }, 500);
      }, 1000);

    } catch (error) {
      onParseProgress(0, 'Import error', 'error');
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to import chat",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center" data-testid="upload-title">
          <i className="fas fa-arrow-up-from-bracket mr-3 text-primary text-xl"></i>
          Upload Chat Transcript
        </h2>
        
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <i className="fas fa-file"></i>
              From File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <i className="fas fa-link"></i>
              From Link/JSON
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FILE */}
          <TabsContent value="file" className="space-y-4">
            {!uploadedFile ? (
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border/50 hover:border-primary hover:bg-primary/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="drop-zone"
              >
                <div className="space-y-4">
                  <div className="text-5xl text-primary">
                    <i className="fas fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Drop your chat file here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <i className="fas fa-mouse"></i>
                      or click to browse
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground border-t border-border/50 pt-4 mt-4">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded inline-block">
                      <i className="fas fa-info-circle mr-1"></i>
                      .md, .txt files (max 10MB)
                    </span>
                  </div>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept=".md,.txt"
                  onChange={handleFileInput}
                  data-testid="file-input"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg hover:border-primary/50 transition-colors" data-testid="file-info">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file-circle-check text-2xl text-primary"></i>
                      <div>
                        <p className="font-semibold text-foreground" data-testid="file-name">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid="file-size">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="text-destructive hover:text-destructive/80 hover:scale-110 transition-transform"
                      onClick={handleRemoveFile}
                      data-testid="button-remove-file"
                    >
                      <i className="fas fa-circle-xmark text-2xl"></i>
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 flex-1 font-semibold"
                    onClick={handleUploadFile}
                    disabled={isUploading}
                    data-testid="button-start-parsing"
                  >
                    {isUploading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Parsing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-wand-magic-sparkles"></i>
                        Parse Now
                      </>
                    )}
                  </button>
                  
                  <button
                    className="border border-border/50 text-foreground px-6 py-3 rounded-md hover:bg-destructive/10 hover:border-destructive/50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                    data-testid="button-cancel"
                  >
                    <i className="fas fa-x"></i>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: LINK OR JSON */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <i className="fas fa-circle-question text-primary"></i>
                  Select chat source:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['chatgpt', 'grok', 'deepseek', 'claude'] as const).map(source => (
                    <button
                      key={source}
                      onClick={() => setSourceType(source)}
                      className={`py-2 px-3 rounded-md border transition-all font-medium ${
                        sourceType === source
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border/50 hover:border-primary'
                      }`}
                      data-testid={`button-source-${source}`}
                    >
                      {source === 'chatgpt' && <><i className="fas fa-robot mr-1"></i>ChatGPT</>}
                      {source === 'grok' && <><i className="fas fa-bolt mr-1"></i>Grok</>}
                      {source === 'deepseek' && <><i className="fas fa-magnifying-glass mr-1"></i>DeepSeek</>}
                      {source === 'claude' && <><i className="fas fa-brain mr-1"></i>Claude</>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <i className="fas fa-code text-primary"></i>
                    Option 1: Paste JSON
                  </h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                      <i className="fas fa-lightbulb text-yellow-500"></i>
                      {sourceType === 'grok' && 'Go to Grok → Share → Export → Copy JSON'}
                      {sourceType === 'chatgpt' && 'Go to ChatGPT → Share → Export → Copy JSON'}
                      {sourceType === 'deepseek' && 'Go to DeepSeek → Share → Export → Copy JSON'}
                      {sourceType === 'claude' && 'Go to Claude → Share → Export → Copy JSON'}
                    </label>
                    <textarea
                      placeholder='Paste the JSON export here...'
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      disabled={isUploading}
                      className="w-full h-32 p-3 border border-border/50 rounded-md bg-background text-foreground text-sm font-mono resize-none focus:border-primary/50 outline-none transition-colors"
                      data-testid="textarea-chat-json"
                    />
                  </div>
                  <button
                    className="w-full bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-semibold"
                    onClick={async () => {
                      if (!jsonText.trim()) {
                        toast({
                          title: "Error",
                          description: "Please paste JSON content",
                          variant: "destructive",
                        });
                        return;
                      }
                      setIsUploading(true);
                      onParseProgress(1, 'Parsing JSON...', 'parsing');
                      try {
                        const response = await fetch('/api/import-chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            json: jsonText,
                            source: sourceType,
                          }),
                          credentials: 'include',
                        });
                        if (!response.ok) throw new Error('Import failed');
                        const result = await response.json();
                        onParseProgress(3, 'Validating...', 'parsing');
                        setTimeout(() => {
                          onParseProgress(4, 'Done!', 'completed');
                          setTimeout(() => {
                            onParseComplete(result.projectId);
                            toast({
                              title: "✅ Import completed",
                              description: `Found ${result.filesFound} files`,
                            });
                            setJsonText('');
                          }, 500);
                        }, 1000);
                      } catch (error) {
                        onParseProgress(0, 'Error', 'error');
                        toast({
                          title: "❌ Error",
                          description: error instanceof Error ? error.message : "Import error",
                          variant: "destructive",
                        });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    disabled={isUploading || !jsonText.trim()}
                  >
                    {isUploading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Importing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-up-from-bracket"></i>
                        Import JSON
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <i className="fas fa-link text-primary"></i>
                    Option 2: Public Link
                  </h3>
                  <div>
                    <Input
                      type="url"
                      placeholder="https://grok.com/share/... (if public)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isUploading}
                      className="border-border/50 focus:border-primary/50"
                      data-testid="input-chat-url"
                    />
                  </div>
                  <button
                    className="w-full bg-secondary text-secondary-foreground px-6 py-2 rounded-md hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-semibold"
                    onClick={handleImportURL}
                    disabled={isUploading || !urlInput.trim()}
                    data-testid="button-import-url"
                  >
                    {isUploading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Importing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-download"></i>
                        Import Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
