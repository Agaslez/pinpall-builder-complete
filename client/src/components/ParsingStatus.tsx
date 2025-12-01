import type { ParseProgress } from "@shared/schema";

interface ParsingStatusProps {
  progress: ParseProgress;
}

const steps = [
  'Wczytywanie pliku...',
  'Identyfikacja bloków kodu...',
  'Parsowanie struktury projektu...',
  'Walidacja kompletności...'
];

export function ParsingStatus({ progress }: ParsingStatusProps) {
  const progressPercentage = (progress.currentStep / progress.totalSteps) * 100;

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < progress.currentStep) {
      return <i className="fas fa-check text-green-500 mr-3"></i>;
    } else if (stepIndex === progress.currentStep && progress.status === 'parsing') {
      return <i className="fas fa-spinner fa-spin text-primary mr-3"></i>;
    } else if (stepIndex === progress.currentStep && progress.status === 'error') {
      return <i className="fas fa-times text-destructive mr-3"></i>;
    } else {
      return <i className="fas fa-clock text-muted-foreground mr-3"></i>;
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < progress.currentStep) {
      return <span className="ml-auto text-green-500 font-medium">Zakończone</span>;
    } else if (stepIndex === progress.currentStep && progress.status === 'parsing') {
      return <span className="ml-auto text-primary font-medium">W toku</span>;
    } else if (stepIndex === progress.currentStep && progress.status === 'error') {
      return <span className="ml-auto text-destructive font-medium">Błąd</span>;
    } else {
      return <span className="ml-auto text-muted-foreground">Oczekuje</span>;
    }
  };

  const getStepTextClass = (stepIndex: number) => {
    if (stepIndex < progress.currentStep) {
      return "text-muted-foreground";
    } else if (stepIndex === progress.currentStep) {
      return "text-foreground font-medium";
    } else {
      return "text-muted-foreground";
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center" data-testid="parsing-status-title">
          <i className="fas fa-cogs mr-2 text-primary"></i>
          Status Parsowania
        </h3>
        
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                progress.status === 'error' ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${progressPercentage}%` }}
              data-testid="progress-bar"
            />
          </div>
          
          {/* Steps */}
          <div className="space-y-3">
            {steps.map((stepName, index) => (
              <div key={index} className="flex items-center text-sm" data-testid={`step-${index}`}>
                {getStepIcon(index)}
                <span className={getStepTextClass(index)}>
                  {stepName}
                </span>
                {getStepStatus(index)}
              </div>
            ))}
          </div>

          {progress.status === 'error' && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-destructive mr-2"></i>
                <span className="text-destructive font-medium">
                  Wystąpił błąd podczas parsowania
                </span>
              </div>
            </div>
          )}

          {progress.status === 'completed' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-green-700 font-medium">
                  Parsowanie zakończone pomyślnie
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
