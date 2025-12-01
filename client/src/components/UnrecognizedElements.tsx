import { useState } from "react";
import type { UnrecognizedElement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UnrecognizedElementsProps {
  elements: UnrecognizedElement[];
  onElementUpdate: () => void;
}

export function UnrecognizedElements({ elements, onElementUpdate }: UnrecognizedElementsProps) {
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleElement = (elementId: string) => {
    const newExpanded = new Set(expandedElements);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setExpandedElements(newExpanded);
  };

  const resolveElement = async (elementId: string, suggestedType?: string) => {
    try {
      await apiRequest('PUT', `/api/unrecognized/${elementId}`, {
        resolved: true,
        suggestedType,
      });
      
      toast({
        title: "Element rozwiązany",
        description: "Nierozpoznany element został oznaczony jako rozwiązany",
      });
      
      onElementUpdate();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się rozwiązać elementu",
        variant: "destructive",
      });
    }
  };

  const autoResolveAll = async () => {
    try {
      const unresolvedElements = elements.filter(el => !el.resolved);
      
      await Promise.all(
        unresolvedElements.map(element =>
          apiRequest('PUT', `/api/unrecognized/${element.id}`, {
            resolved: true,
            suggestedType: element.suggestedType || 'Auto-resolved',
          })
        )
      );

      toast({
        title: "Auto-resolve zakończone",
        description: `Rozwiązano ${unresolvedElements.length} elementów`,
      });

      onElementUpdate();
    } catch (error) {
      toast({
        title: "Błąd auto-resolve",
        description: "Nie udało się automatycznie rozwiązać wszystkich elementów",
        variant: "destructive",
      });
    }
  };

  const unresolvedElements = elements.filter(el => !el.resolved);

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center" data-testid="unrecognized-elements-title">
          <i className="fas fa-exclamation-triangle mr-2 text-amber-500"></i>
          Nierozpoznane Elementy
        </h3>
        
        {unresolvedElements.length > 0 ? (
          <div className="space-y-4">
            {/* Warning Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start">
                <i className="fas fa-exclamation-triangle text-amber-500 mr-3 mt-0.5"></i>
                <div>
                  <h4 className="font-medium text-amber-800">Znaleziono nierozpoznane fragmenty</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Sprawdź poniższe elementy przed generowaniem projektu
                  </p>
                </div>
              </div>
            </div>
            
            {/* Unrecognized Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {unresolvedElements.map((element) => (
                <div key={element.id} className="border border-border rounded-md p-3" data-testid={`unrecognized-element-${element.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{element.context}</span>
                    <div className="flex space-x-1">
                      <button 
                        className="text-primary hover:text-primary/80 text-sm"
                        onClick={() => toggleElement(element.id)}
                        data-testid={`button-toggle-${element.id}`}
                      >
                        <i className={`fas ${expandedElements.has(element.id) ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>
                      <button 
                        className="text-primary hover:text-primary/80 text-sm"
                        onClick={() => resolveElement(element.id, element.suggestedType || undefined)}
                        data-testid={`button-resolve-${element.id}`}
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    </div>
                  </div>
                  
                  <code className="text-xs bg-muted p-2 rounded block" data-testid={`element-content-${element.id}`}>
                    {expandedElements.has(element.id) 
                      ? element.content 
                      : element.content.substring(0, 100) + (element.content.length > 100 ? '...' : '')
                    }
                  </code>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Linia: {element.lineNumber} | Sugerowany typ: {element.suggestedType || 'Nieznany'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors text-sm flex-1"
                onClick={autoResolveAll}
                data-testid="button-auto-resolve"
              >
                <i className="fas fa-magic mr-2"></i>
                Auto-resolve ({unresolvedElements.length})
              </button>
              <button 
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm"
                data-testid="button-export-unrecognized"
              >
                <i className="fas fa-download mr-2"></i>
                Eksportuj
              </button>
            </div>
          </div>
        ) : elements.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
            <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
            <h4 className="font-medium text-green-800">Wszystkie elementy rozwiązane</h4>
            <p className="text-sm text-green-700 mt-1">
              Wszystkie nierozpoznane elementy zostały przetworzone
            </p>
          </div>
        ) : (
          <div className="bg-muted rounded-md p-8 text-center text-muted-foreground">
            <i className="fas fa-check-circle text-4xl mb-4"></i>
            <p>Brak nierozpoznanych elementów</p>
            <p className="text-sm mt-1">Parser pomyślnie zidentyfikował wszystkie elementy</p>
          </div>
        )}
      </div>
    </div>
  );
}
