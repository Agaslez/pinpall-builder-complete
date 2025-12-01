import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ParsedFile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditPanelProps {
  files: ParsedFile[];
  onFileUpdate: () => void;
}

export function EditPanel({ files, onFileUpdate }: EditPanelProps) {
  const [editingFile, setEditingFile] = useState<ParsedFile | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editPath, setEditPath] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const editableFiles = files.filter(file => file.fileType === 'file' && file.content.trim());

  const startEdit = (file: ParsedFile) => {
    setEditingFile(file);
    setEditContent(file.content);
    setEditPath(file.filePath);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!editingFile) return;

    try {
      await apiRequest('PUT', `/api/files/${editingFile.id}`, {
        content: editContent,
        filePath: editPath,
      });

      toast({
        title: "Plik zaktualizowany",
        description: "Zmiany zostały zapisane pomyślnie",
      });

      setIsEditing(false);
      setEditingFile(null);
      onFileUpdate();
    } catch (error) {
      toast({
        title: "Błąd zapisu",
        description: "Nie udało się zapisać zmian",
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await apiRequest('DELETE', `/api/files/${fileId}`);
      
      toast({
        title: "Plik usunięty",
        description: "Plik został usunięty z projektu",
      });

      onFileUpdate();
    } catch (error) {
      toast({
        title: "Błąd usuwania",
        description: "Nie udało się usunąć pliku",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': 'fab fa-js-square text-yellow-500',
      'jsx': 'fab fa-react text-blue-500', 
      'ts': 'fas fa-file-code text-blue-600',
      'tsx': 'fab fa-react text-blue-500',
      'py': 'fab fa-python text-green-600',
      'html': 'fab fa-html5 text-orange-500',
      'css': 'fab fa-css3-alt text-blue-500',
      'json': 'fas fa-file-alt text-green-500',
      'md': 'fab fa-markdown text-gray-600',
    };

    return iconMap[ext || ''] || 'fas fa-file-code';
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center" data-testid="edit-panel-title">
            <i className="fas fa-edit mr-2 text-primary"></i>
            Edycja Przed Generowaniem
          </h3>
          <button 
            className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-md hover:bg-secondary/80"
            data-testid="button-edit-all"
          >
            Edytuj wszystkie
          </button>
        </div>
        
        {editableFiles.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {editableFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-accent rounded-md" data-testid={`file-item-${file.id}`}>
                <div className="flex items-center space-x-3">
                  <i className={getFileIcon(file.filePath)}></i>
                  <div>
                    <p className="font-medium" data-testid={`file-path-${file.id}`}>{file.filePath}</p>
                    <p className="text-sm text-muted-foreground" data-testid={`file-lines-${file.id}`}>
                      {file.lineCount} linii
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button 
                        className="text-primary hover:text-primary/80 text-sm"
                        data-testid={`button-view-${file.id}`}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{file.filePath}</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
                          <code>{file.content}</code>
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isEditing && editingFile?.id === file.id} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <button 
                        className="text-secondary hover:text-secondary/80 text-sm"
                        onClick={() => startEdit(file)}
                        data-testid={`button-edit-${file.id}`}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Edytuj plik</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Ścieżka pliku</label>
                          <Input
                            value={editPath}
                            onChange={(e) => setEditPath(e.target.value)}
                            data-testid="input-edit-path"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Zawartość</label>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="font-mono text-sm min-h-[400px]"
                            data-testid="textarea-edit-content"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={saveEdit} data-testid="button-save-edit">
                            <i className="fas fa-save mr-2"></i>
                            Zapisz
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <button 
                    className="text-destructive hover:text-destructive/80 text-sm"
                    onClick={() => deleteFile(file.id)}
                    data-testid={`button-delete-${file.id}`}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted rounded-md p-8 text-center text-muted-foreground">
            <i className="fas fa-file-code text-4xl mb-4"></i>
            <p>Brak plików do edycji</p>
            <p className="text-sm mt-1">Pliki z zawartością pojawią się tutaj po parsowaniu</p>
          </div>
        )}
      </div>
    </div>
  );
}
