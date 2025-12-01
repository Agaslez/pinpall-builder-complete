import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const parseProjects = pgTable("parse_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  parseStatus: text("parse_status").notNull(), // parsing, completed, error
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const parsedFiles = pgTable("parsed_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => parseProjects.id).notNull(),
  filePath: text("file_path").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(),
  language: text("language"),
  lineCount: integer("line_count").notNull(),
  isGenerated: boolean("is_generated").default(true),
});

export const unrecognizedElements = pgTable("unrecognized_elements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => parseProjects.id).notNull(),
  content: text("content").notNull(),
  context: text("context"),
  lineNumber: integer("line_number"),
  suggestedType: text("suggested_type"),
  resolved: boolean("resolved").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertParseProjectSchema = createInsertSchema(parseProjects).pick({
  name: true,
  originalFileName: true,
  fileSize: true,
});

export const insertParsedFileSchema = createInsertSchema(parsedFiles).pick({
  projectId: true,
  filePath: true,
  content: true,
  fileType: true,
  language: true,
  lineCount: true,
});

export const insertUnrecognizedElementSchema = createInsertSchema(unrecognizedElements).pick({
  projectId: true,
  content: true,
  context: true,
  lineNumber: true,
  suggestedType: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertParseProject = z.infer<typeof insertParseProjectSchema>;
export type ParseProject = typeof parseProjects.$inferSelect;
export type InsertParsedFile = z.infer<typeof insertParsedFileSchema>;
export type ParsedFile = typeof parsedFiles.$inferSelect;
export type InsertUnrecognizedElement = z.infer<typeof insertUnrecognizedElementSchema>;
export type UnrecognizedElement = typeof unrecognizedElements.$inferSelect;

export interface ParsedProject {
  project: ParseProject;
  files: ParsedFile[];
  unrecognizedElements: UnrecognizedElement[];
}

export interface FileTypeStats {
  [key: string]: number;
}

export interface ParseProgress {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  status: 'idle' | 'parsing' | 'completed' | 'error';
}
