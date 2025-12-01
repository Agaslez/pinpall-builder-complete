import type { ParsedFile } from "@shared/schema";

interface ProjectStructureProps {
  files: ParsedFile[];
  projectName: string;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children: FileNode[];
  language?: string;
}

export function ProjectStructure({ files, projectName }: ProjectStructureProps) {
  
  const buildFileTree = (files: ParsedFile[]): FileNode[] => {
    const root: FileNode = {
      name: projectName || 'project',
      type: 'folder',
      path: '',
      children: [],
    };

    // Sort files to ensure folders come first
    const sortedFiles = [...files].sort((a, b) => {
      if (a.fileType !== b.fileType) {
        return a.fileType === 'folder' ? -1 : 1;
      }
      return a.filePath.localeCompare(b.filePath);
    });

    sortedFiles.forEach(file => {
      const pathParts = file.filePath.split('/').filter(part => part);
      let currentNode = root;

      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        let existingNode = currentNode.children.find(child => child.name === part);

        if (!existingNode) {
          existingNode = {
            name: part,
            type: isLast ? (file.fileType as 'file' | 'folder') : 'folder',
            path: pathParts.slice(0, index + 1).join('/'),
            children: [],
            language: isLast ? file.language || undefined : undefined,
          };
          currentNode.children.push(existingNode);
        }

        currentNode = existingNode;
      });
    });

    return root.children;
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return <i className="fas fa-folder text-amber-500 mr-2"></i>;
    }

    const ext = node.name.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': 'fab fa-js-square text-yellow-500',
      'jsx': 'fab fa-react text-blue-500',
      'ts': 'fas fa-file-code text-blue-600',
      'tsx': 'fab fa-react text-blue-500',
      'py': 'fab fa-python text-green-600',
      'java': 'fab fa-java text-red-600',
      'html': 'fab fa-html5 text-orange-500',
      'css': 'fab fa-css3-alt text-blue-500',
      'json': 'fas fa-file-alt text-green-500',
      'md': 'fab fa-markdown text-gray-600',
      'yml': 'fas fa-file-code text-purple-500',
      'yaml': 'fas fa-file-code text-purple-500',
      'xml': 'fas fa-file-code text-orange-500',
      'sql': 'fas fa-database text-blue-600',
      'dockerfile': 'fab fa-docker text-blue-600',
    };

    const iconClass = iconMap[ext || ''] || 'fas fa-file text-gray-500';
    return <i className={`${iconClass} mr-2`}></i>;
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const indentClass = depth > 0 ? `ml-${depth * 4}` : '';
    
    return (
      <div key={node.path || node.name} className={`space-y-1 ${indentClass}`}>
        <div className="flex items-center" data-testid={`file-node-${node.name}`}>
          {getFileIcon(node)}
          <span className={node.type === 'folder' ? 'font-semibold' : ''}>
            {node.name}
            {node.type === 'folder' ? '/' : ''}
          </span>
        </div>
        {node.children.map(child => renderFileNode(child, depth + 1))}
      </div>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center" data-testid="project-structure-title">
          <i className="fas fa-sitemap mr-2 text-primary"></i>
          Struktura Projektu
        </h3>
        
        {fileTree.length > 0 ? (
          <div className="bg-muted rounded-md p-4 font-mono text-sm max-h-96 overflow-y-auto">
            <div className="space-y-1" data-testid="project-structure-tree">
              <div className="flex items-center">
                <i className="fas fa-folder text-amber-500 mr-2"></i>
                <span className="font-semibold">{projectName || 'projekt'}/</span>
              </div>
              {fileTree.map(node => renderFileNode(node, 1))}
            </div>
          </div>
        ) : (
          <div className="bg-muted rounded-md p-8 text-center text-muted-foreground">
            <i className="fas fa-folder-open text-4xl mb-4"></i>
            <p>Brak plików do wyświetlenia</p>
            <p className="text-sm mt-1">Wczytaj transkrypt czatu aby zobaczyć strukturę</p>
          </div>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground text-center" data-testid="structure-status">
          {files.length > 0 
            ? 'Aktualizuje się w czasie rzeczywistym podczas parsowania'
            : 'Struktura zostanie wyświetlona po parsowaniu'
          }
        </div>
      </div>
    </div>
  );
}
