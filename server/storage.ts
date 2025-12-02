import {
  type InsertParsedFile,
  type InsertParseProject,
  type InsertUnrecognizedElement,
  type InsertUser,
  type ParsedFile,
  type ParsedProject,
  type ParseProject,
  type UnrecognizedElement,
  type User
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

interface StorageData {
  users: Record<string, User>;
  parseProjects: Record<string, ParseProject>;
  parsedFiles: Record<string, ParsedFile>;
  unrecognizedElements: Record<string, UnrecognizedElement>;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createParseProject(project: InsertParseProject & { id?: string }): Promise<ParseProject>;
  getParseProject(id: string): Promise<ParseProject | undefined>;
  getAllParseProjects(): Promise<ParseProject[]>;
  updateParseProjectStatus(id: string, status: string): Promise<void>;
  
  createParsedFile(file: InsertParsedFile): Promise<ParsedFile>;
  getParsedFilesByProject(projectId: string): Promise<ParsedFile[]>;
  updateParsedFile(id: string, updates: Partial<ParsedFile>): Promise<void>;
  deleteParsedFile(id: string): Promise<void>;
  
  createUnrecognizedElement(element: InsertUnrecognizedElement): Promise<UnrecognizedElement>;
  getUnrecognizedElementsByProject(projectId: string): Promise<UnrecognizedElement[]>;
  updateUnrecognizedElement(id: string, updates: Partial<UnrecognizedElement>): Promise<void>;
  
  getFullProject(projectId: string): Promise<ParsedProject | undefined>;
}

class BaseStorage {
  protected async saveToFile(data: StorageData): Promise<void> {
    try {
      const storageDir = path.join(process.cwd(), 'storage');
      await fs.mkdir(storageDir, { recursive: true });
      
      // Konwertuj daty na stringi przed zapisem
      const serializableData = {
        users: this.serializeDates(data.users),
        parseProjects: this.serializeDates(data.parseProjects),
        parsedFiles: this.serializeDates(data.parsedFiles),
        unrecognizedElements: this.serializeDates(data.unrecognizedElements)
      };
      
      await fs.writeFile(
        path.join(storageDir, 'data.json'),
        JSON.stringify(serializableData, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save storage data:', error);
    }
  }

  protected async loadFromFile(): Promise<StorageData> {
    try {
      const storageDir = path.join(process.cwd(), 'storage');
      const filePath = path.join(storageDir, 'data.json');
      
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Konwertuj stringi z powrotem na Date
      return {
        users: this.deserializeDates(parsed.users),
        parseProjects: this.deserializeDates(parsed.parseProjects),
        parsedFiles: this.deserializeDates(parsed.parsedFiles),
        unrecognizedElements: this.deserializeDates(parsed.unrecognizedElements)
      };
    } catch (error) {
      // Jeśli plik nie istnieje, zwróć pusty obiekt
      return {
        users: {},
        parseProjects: {},
        parsedFiles: {},
        unrecognizedElements: {}
      };
    }
  }

  private serializeDates(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (value instanceof Date) {
          return [key, value.toISOString()];
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return [key, this.serializeDates(value)];
        }
        return [key, value];
      })
    );
  }

  private deserializeDates(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (key === 'createdAt' || key === 'updatedAt') {
          return [key, new Date(value)];
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return [key, this.deserializeDates(value)];
        }
        return [key, value];
      })
    );
  }
}

export class MemStorage extends BaseStorage implements IStorage {
  private users: Map<string, User>;
  private parseProjects: Map<string, ParseProject>;
  private parsedFiles: Map<string, ParsedFile>;
  private unrecognizedElements: Map<string, UnrecognizedElement>;

  constructor() {
    super();
    this.users = new Map();
    this.parseProjects = new Map();
    this.parsedFiles = new Map();
    this.unrecognizedElements = new Map();
    this.initializeFromFile();
  }

  private async initializeFromFile() {
    try {
      const data = await this.loadFromFile();
      
      this.users = new Map(Object.entries(data.users));
      this.parseProjects = new Map(Object.entries(data.parseProjects));
      this.parsedFiles = new Map(Object.entries(data.parsedFiles));
      this.unrecognizedElements = new Map(Object.entries(data.unrecognizedElements));
      
      console.log(`Loaded from storage: ${this.parseProjects.size} projects, ${this.parsedFiles.size} files`);
    } catch (error) {
      console.error('Failed to initialize storage from file:', error);
    }
  }

  private async saveAll() {
    const data: StorageData = {
      users: Object.fromEntries(this.users),
      parseProjects: Object.fromEntries(this.parseProjects),
      parsedFiles: Object.fromEntries(this.parsedFiles),
      unrecognizedElements: Object.fromEntries(this.unrecognizedElements)
    };
    await this.saveToFile(data);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    await this.saveAll();
    return user;
  }

  async createParseProject(insertProject: InsertParseProject & { id?: string }): Promise<ParseProject> {
    const id = insertProject.id || randomUUID();
    const now = new Date();
    const project: ParseProject = {
      ...insertProject,
      id,
      parseStatus: 'parsing',
      createdAt: now,
      updatedAt: now,
      fileSize: insertProject.fileSize || 0,
    };
    this.parseProjects.set(id, project);
    await this.saveAll();
    return project;
  }

  async getParseProject(id: string): Promise<ParseProject | undefined> {
    return this.parseProjects.get(id);
  }

  async getAllParseProjects(): Promise<ParseProject[]> {
    return Array.from(this.parseProjects.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateParseProjectStatus(id: string, status: string): Promise<void> {
    const project = this.parseProjects.get(id);
    if (project) {
      project.parseStatus = status;
      project.updatedAt = new Date();
      this.parseProjects.set(id, project);
      await this.saveAll();
    }
  }

  async createParsedFile(insertFile: InsertParsedFile): Promise<ParsedFile> {
    const id = randomUUID();
    const file: ParsedFile = { 
      ...insertFile, 
      id, 
      language: insertFile.language || null,
      isGenerated: true,
      lineCount: insertFile.lineCount || 0,
    };
    this.parsedFiles.set(id, file);
    await this.saveAll();
    return file;
  }

  async getParsedFilesByProject(projectId: string): Promise<ParsedFile[]> {
    return Array.from(this.parsedFiles.values())
      .filter(file => file.projectId === projectId)
      .sort((a, b) => a.filePath.localeCompare(b.filePath));
  }

  async updateParsedFile(id: string, updates: Partial<ParsedFile>): Promise<void> {
    const file = this.parsedFiles.get(id);
    if (file) {
      Object.assign(file, updates);
      this.parsedFiles.set(id, file);
      await this.saveAll();
    }
  }

  async deleteParsedFile(id: string): Promise<void> {
    this.parsedFiles.delete(id);
    await this.saveAll();
  }

  async createUnrecognizedElement(insertElement: InsertUnrecognizedElement): Promise<UnrecognizedElement> {
    const id = randomUUID();
    const element: UnrecognizedElement = { 
      ...insertElement, 
      id,
      context: insertElement.context || null,
      lineNumber: insertElement.lineNumber || null,
      suggestedType: insertElement.suggestedType || null,
      resolved: false 
    };
    this.unrecognizedElements.set(id, element);
    await this.saveAll();
    return element;
  }

  async getUnrecognizedElementsByProject(projectId: string): Promise<UnrecognizedElement[]> {
    return Array.from(this.unrecognizedElements.values())
      .filter(element => element.projectId === projectId);
  }

  async updateUnrecognizedElement(id: string, updates: Partial<UnrecognizedElement>): Promise<void> {
    const element = this.unrecognizedElements.get(id);
    if (element) {
      Object.assign(element, updates);
      this.unrecognizedElements.set(id, element);
      await this.saveAll();
    }
  }

  async getFullProject(projectId: string): Promise<ParsedProject | undefined> {
    const project = await this.getParseProject(projectId);
    if (!project) return undefined;
    
    const files = await this.getParsedFilesByProject(projectId);
    const unrecognizedElements = await this.getUnrecognizedElementsByProject(projectId);
    
    return {
      project,
      files,
      unrecognizedElements,
    };
  }
}

export const storage = new MemStorage();
