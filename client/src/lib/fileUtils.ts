export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isValidFileType = (filename: string, allowedExtensions: string[]): boolean => {
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
};

export const detectLanguageFromExtension = (extension: string): string | undefined => {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'xml': 'xml',
    'yml': 'yaml',
    'yaml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'dockerfile': 'dockerfile',
  };

  return languageMap[extension];
};

export const generateProjectStructure = (files: Array<{ filePath: string; type: string }>): string => {
  const tree: Record<string, any> = {};
  
  files.forEach(file => {
    const parts = file.filePath.split('/');
    let current = tree;
    
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 && file.type === 'file' ? null : {};
      }
      current = current[part];
    });
  });
  
  const buildTreeString = (obj: any, indent = 0): string => {
    let result = '';
    const prefix = '  '.repeat(indent);
    
    Object.keys(obj).forEach(key => {
      if (obj[key] === null) {
        result += `${prefix}${key}\n`;
      } else {
        result += `${prefix}${key}/\n`;
        result += buildTreeString(obj[key], indent + 1);
      }
    });
    
    return result;
  };
  
  return buildTreeString(tree);
};
