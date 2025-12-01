import { 
  type User, 
  type InsertUser, 
  type ParseProject, 
  type InsertParseProject,
  type ParsedFile,
  type InsertParsedFile,
  type UnrecognizedElement,
  type InsertUnrecognizedElement,
  type ParsedProject
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createParseProject(project: InsertParseProject): Promise<ParseProject>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private parseProjects: Map<string, ParseProject>;
  private parsedFiles: Map<string, ParsedFile>;
  private unrecognizedElements: Map<string, UnrecognizedElement>;

  constructor() {
    this.users = new Map();
    this.parseProjects = new Map();
    this.parsedFiles = new Map();
    this.unrecognizedElements = new Map();
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
    return user;
  }

  async createParseProject(insertProject: InsertParseProject): Promise<ParseProject> {
    const id = randomUUID();
    const now = new Date();
    const project: ParseProject = {
      ...insertProject,
      id,
      parseStatus: 'parsing',
      createdAt: now,
      updatedAt: now,
    };
    this.parseProjects.set(id, project);
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
    }
  }

  async createParsedFile(insertFile: InsertParsedFile): Promise<ParsedFile> {
    const id = randomUUID();
    const file: ParsedFile = { 
      ...insertFile, 
      id, 
      language: insertFile.language || null,
      isGenerated: true 
    };
    this.parsedFiles.set(id, file);
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
    }
  }

  async deleteParsedFile(id: string): Promise<void> {
    this.parsedFiles.delete(id);
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
