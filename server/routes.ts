import express, { Express } from 'express';
import multer from 'multer';
import JSZip from 'jszip';
import { ChatParser } from './chatParser';
import { storage } from './storage';
import { ChatImporter } from './parsers/ChatImporter';
import { createCheckoutSession } from './stripe';
import { v4 as uuidv4 } from 'uuid';

export async function registerRoutes(app: Express) {
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
  });
  const chatImporter = new ChatImporter();

  app.post('/api/parse-chat', upload.single('chatFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const content = req.file.buffer.toString('utf-8');
      const parser = new ChatParser(content);
      const parsed = parser.parse();

      const projectId = uuidv4();
      await storage.createParseProject({
        name: req.file.originalname.replace(/\.[^.]+$/, ''),
        originalFileName: req.file.originalname,
      });

      // Create files
      for (const file of parsed.files) {
        await storage.createParsedFile({
          projectId,
          filePath: file.path || 'untitled',
          content: file.content || '',
          fileType: file.type as 'file' | 'folder',
          language: file.language,
        });
      }

      // Create unrecognized elements
      for (const element of parsed.unrecognizedBlocks) {
        await storage.createUnrecognizedElement({
          projectId,
          content: element.content || '',
          lineNumber: element.lineNumber || 0,
          context: element.context || '',
          suggestedType: 'unknown',
        });
      }

      res.json({
        projectId,
        filesFound: parsed.files.filter(f => f.type === 'file').length,
        unrecognizedCount: parsed.unrecognizedBlocks.length,
      });
    } catch (error) {
      console.error('Parse error:', error);
      res.status(500).json({ error: 'Failed to parse chat' });
    }
  });

  app.post('/api/import-chat', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { url, json, source } = req.body;
      let content: string;

      if (url) {
        const result = await chatImporter.importFromURL(url);
        content = result.content;
      } else if (json) {
        const result = await chatImporter.importFromJSON(json);
        content = result.content;
      } else {
        return res.status(400).json({ error: 'Provide url or json' });
      }

      const parser = new ChatParser(content);
      const parsed = parser.parse();

      const projectId = uuidv4();
      await storage.createParseProject({
        name: `${source || 'Chat'}_${new Date().toISOString().slice(0, 10)}`,
        originalFileName: `${source || 'import'}.txt`,
      });

      // Create files
      for (const file of parsed.files) {
        await storage.createParsedFile({
          projectId,
          filePath: file.path || 'untitled',
          content: file.content || '',
          fileType: file.type as 'file' | 'folder',
          language: file.language,
        });
      }

      // Create unrecognized elements
      for (const element of parsed.unrecognizedBlocks) {
        await storage.createUnrecognizedElement({
          projectId,
          content: element.content || '',
          lineNumber: element.lineNumber || 0,
          context: element.context || '',
          suggestedType: 'unknown',
        });
      }

      res.json({
        projectId,
        filesFound: parsed.files.filter(f => f.type === 'file').length,
        unrecognizedCount: parsed.unrecognizedBlocks.length,
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ error: `Failed to import: ${error}` });
    }
  });

  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getAllParseProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list projects' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getParseProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get project' });
    }
  });

  app.put('/api/unrecognized/:id', express.json(), async (req, res) => {
    try {
      const { resolved, suggestedType } = req.body;
      
      await storage.updateUnrecognizedElement(req.params.id, {
        resolved,
        suggestedType,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating unrecognized element:', error);
      res.status(500).json({ error: 'Błąd podczas aktualizacji elementu' });
    }
  });

  app.get('/api/projects/:id/download', async (req, res) => {
    try {
      const fullProject = await storage.getFullProject(req.params.id);
      
      if (!fullProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const zip = new JSZip();
      
      fullProject.files
        .filter(file => file.fileType === 'file' && file.content.trim())
        .forEach(file => {
          zip.file(file.filePath, file.content);
        });

      fullProject.files
        .filter(file => file.fileType === 'folder')
        .forEach(folder => {
          zip.folder(folder.filePath);
        });

      if (fullProject.unrecognizedElements.length > 0) {
        let readmeContent = `# ${fullProject.project.name}\n\n`;
        readmeContent += `## Unrecognized Elements\n\n`;
        readmeContent += `Found ${fullProject.unrecognizedElements.length} unrecognized elements:\n\n`;
        
        fullProject.unrecognizedElements.forEach((element, index) => {
          readmeContent += `### Element ${index + 1}\n`;
          readmeContent += `**Line:** ${element.lineNumber}\n`;
          readmeContent += `**Context:** ${element.context}\n`;
          readmeContent += `**Suggested Type:** ${element.suggestedType || 'Unknown'}\n`;
          readmeContent += `**Content:**\n\`\`\`\n${element.content}\n\`\`\`\n\n`;
        });
        
        zip.file('UNRECOGNIZED_ELEMENTS.md', readmeContent);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fullProject.project.name}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      });
      
      res.send(zipBuffer);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to generate ZIP' });
    }
  });

  // NOWY: Checkout endpoint
  app.post('/api/checkout', express.json(), async (req, res) => {
    try {
      const { tier, email } = req.body;
      
      if (!['pro', 'enterprise'].includes(tier)) {
        return res.status(400).json({ error: 'Invalid tier' });
      }

      const session = await createCheckoutSession(tier, email);
      res.json({ url: session.url });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  return app;
}
