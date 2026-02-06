/**
 * Claude Skills Manager - Type Definitions
 */

export enum SkillCategory {
  Development = "Development",
  Writing = "Writing",
  Analysis = "Analysis",
  Meetings = "Meetings",
  Templates = "Templates",
  Other = "Other",
}

export type SkillSource = "official" | "custom";

/**
 * Lightweight metadata stored in LocalStorage
 */
export interface SkillMetadata {
  id: string;
  title: string;
  description: string;
  category: SkillCategory;
  githubPath?: string; // GitHub file path (for official skills)
  author?: string;
  url?: string;
  tags: string[];
  favorite: boolean;
  source: SkillSource;
  createdAt: number;
  updatedAt: number;
}

/**
 * Full skill data (loaded on demand)
 */
export interface ClaudeSkill extends SkillMetadata {
  content: string; // Markdown format
}

/**
 * Cache entry for skill content
 */
export interface CachedContent {
  skillId: string;
  content: string;
  cachedAt: number;
  lastAccessed: number;
}

/**
 * Skills index stored in LocalStorage
 */
export interface SkillsIndex {
  skills: SkillMetadata[];
  lastUpdated: number;
}

/**
 * Content cache stored in LocalStorage
 */
export interface ContentCache {
  [skillId: string]: CachedContent;
}

/**
 * GitHub API response types
 */
export interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string;
  sha: string;
}

/**
 * YAML frontmatter parsed from SKILL.md
 */
export interface SkillFrontmatter {
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  author?: string;
  url?: string;
}
