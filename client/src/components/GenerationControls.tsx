import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ParseProject } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface GenerationControlsProps {
  project: ParseProject;
}

export function GenerationControls({ project }: GenerationControlsProps) {
  const [projectName, setProjectName] = useState(project.name);
  const [outputFormat, setOutputFormat] = useState("zip");
  const [includeReadme, setIncludeReadme] = useState(true);
  const [validateStructure, setValidateStructure] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}/download`);
      
      if (!response.ok) {
        throw new Error('Błąd podczas generowania projektu');
      }

      const blob = await response.blob();
      
      // Sprawdź czy blob zawiera dane
      if (blob.size === 0) {
        throw new Error('Otrzymano pusty plik');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Nazwa pliku bez znaków specjalnych
      const safeName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
      a.download = `${safeName}.zip`;
      
      document.body.appendChild(a);
      a.click();
      
      // Alternatywna metoda - otwórz w nowej karcie jeśli kliknięcie nie zadziałało
      setTimeout(() => {
        try {
          window.open(url, '_blank');
        } catch (e) {
          console.log('Fallback download nie działał');
        }
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "Projekt wygenerowany",
        description: `ZIP o rozmiarze ${(blob.size / 1024).toFixed(1)}KB został pobrany`,
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Błąd generowania",
        description: error instanceof Error ? error.message : "Nie udało się wygenerować projektu",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    toast({
      title: "Podgląd",
      description: "Funkcja podglądu będzie dostępna wkrótce",
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center" data-testid="generation-controls-title">
          <i className="fas fa-rocket mr-2 text-primary"></i>
          Generowanie Projektu
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nazwa projektu</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="stefano-enterprise"
                data-testid="input-project-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Format wyjściowy</label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger data-testid="select-output-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zip">ZIP Archive</SelectItem>
                  <SelectItem value="git">Git Repository</SelectItem>
                  <SelectItem value="folder">Folder Structure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeReadme"
                checked={includeReadme}
                onCheckedChange={(checked) => setIncludeReadme(!!checked)}
                data-testid="checkbox-include-readme"
              />
              <label htmlFor="includeReadme" className="text-sm">
                Dołącz wygenerowany README.md
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="validateStructure"
                checked={validateStructure}
                onCheckedChange={(checked) => setValidateStructure(!!checked)}
                data-testid="checkbox-validate-structure"
              />
              <label htmlFor="validateStructure" className="text-sm">
                Waliduj strukturę przed generowaniem
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center"
              data-testid="button-generate-download"
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generowanie...
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>
                  Generuj i Pobierz
                </>
              )}
            </Button>
            
            <Button 
              variant="secondary"
              onClick={handlePreview}
              disabled={isGenerating}
              data-testid="button-preview"
            >
              <i className="fas fa-eye mr-2"></i>
              Podgląd
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
