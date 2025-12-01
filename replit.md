# Overview

This is "PINpall - builder" application - an intelligent chat transcript parser that analyzes conversation logs and creates complete project structures with full code and reporting of unrecognized elements. The system accepts markdown or text files containing chat transcripts, parses them to identify code blocks and file instructions, then generates a downloadable project archive with proper file organization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Framework**: Shadcn/ui components built on Radix UI primitives 
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **File Upload**: Uppy.js with drag-and-drop support and AWS S3 integration

## Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with file upload support via Multer
- **File Processing**: Custom ChatParser class for analyzing transcript content
- **Archive Generation**: JSZip for creating downloadable project packages

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with schema-first approach
- **Storage Strategy**: In-memory storage fallback with interface abstraction
- **File Storage**: Google Cloud Storage integration for uploaded files

## Core Data Models
- **ParseProjects**: Main project metadata including name, file info, and parsing status
- **ParsedFiles**: Individual files extracted from transcripts with content and metadata
- **UnrecognizedElements**: Elements that couldn't be automatically categorized
- **Users**: Basic user management (though not actively used in current flow)

## Authentication and Authorization
- **Current State**: Basic user schema exists but no active authentication flow
- **Session Management**: Cookie-based sessions configured but not enforced
- **Access Control**: Open access to parsing functionality

## File Processing Pipeline
1. **Upload Validation**: File type checking (MD/TXT only) with size limits
2. **Content Extraction**: Text parsing with UTF-8 encoding
3. **Pattern Recognition**: Regex-based identification of code blocks and file paths
4. **Structure Analysis**: Building file trees and identifying project organization
5. **Element Classification**: Separating recognized code from unrecognized content
6. **Archive Generation**: Creating downloadable ZIP with proper folder structure

## Frontend Components Architecture
- **Upload Interface**: Drag-and-drop file upload with progress tracking
- **Parsing Status**: Real-time progress display with step-by-step feedback
- **Project Structure**: Tree view of extracted files and folders
- **Edit Panel**: In-browser file content editing capabilities
- **Unrecognized Elements**: Manual review and classification of unclear content
- **Generation Controls**: Project export and download options