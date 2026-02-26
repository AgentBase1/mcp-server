#!/usr/bin/env node

/**
 * OpenClaw MCP Server
 * Gives AI agents direct tool access to the OpenClaw agent instruction registry.
 * 
 * Tools:
 *   - search_registry: Search by keyword, category, tags, quality score
 *   - get_instruction: Fetch a full instruction file by slug
 *   - list_categories: List all categories with counts
 *   - get_featured: Return all featured files
 * 
 * Install: npx openclaw-mcp
 * Config: Add to claude_desktop_config.json, Continue, or any MCP host
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BASE_URL = 'https://openclaw-sandy-eight.vercel.app';
const INDEX_URL = `${BASE_URL}/registry/index.json`;

// --- Helpers ---

async function fetchIndex() {
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`Registry unavailable: ${res.status}`);
  return res.json();
}

async function fetchFile(slug) {
  const url = `${BASE_URL}/registry/${slug}.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`File not found: ${slug} (${res.status})`);
  return res.text();
}

function extractInstruction(markdown) {
  // Pull out just the fenced code block under ## The Instruction
  const match = markdown.match(/## The Instruction\s*\n[\s\S]*?```[\w]*\n([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Fallback: return everything after ## The Instruction
  const headerMatch = markdown.split(/## The Instruction/);
  if (headerMatch.length > 1) return headerMatch[1].trim();
  return null;
}

// --- Tool definitions ---

const TOOLS = [
  {
    name: 'search_registry',
    description: 'Search the OpenClaw agent instruction registry. Returns matching instruction files with metadata. Use this to find system prompts, skills, workflows, domain packs, safety filters, and orchestration patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        q: {
          type: 'string',
          description: 'Keyword search across title, tags, and slug. Optional.'
        },
        category: {
          type: 'string',
          description: 'Filter by category. One of: system-prompts, skills, workflows, tool-definitions, domain-packs, safety-filters, orchestration',
          enum: ['system-prompts', 'skills', 'workflows', 'tool-definitions', 'domain-packs', 'safety-filters', 'orchestration']
        },
        min_quality: {
          type: 'number',
          description: 'Minimum quality score (0-100). Recommended: 80 for production use.',
          minimum: 0,
          maximum: 100
        },
        featured_only: {
          type: 'boolean',
          description: 'If true, return only featured (quality >= 90) files.'
        }
      }
    }
  },
  {
    name: 'get_instruction',
    description: 'Fetch a complete instruction file from the OpenClaw registry by slug. Returns the full Markdown file including YAML frontmatter, purpose, usage notes, and the deployable instruction text. The instruction is in the "## The Instruction" section.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The slug of the instruction file (e.g. "tier1-customer-support", "structured-web-research"). Get slugs from search_registry.'
        },
        instruction_only: {
          type: 'boolean',
          description: 'If true, return only the deployable instruction text (extracted from the fenced code block). If false, return the full Markdown file. Default: false.'
        }
      },
      required: ['slug']
    }
  },
  {
    name: 'list_categories',
    description: 'List all categories in the OpenClaw registry with file counts and descriptions. Use this to understand what types of instruction files are available.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_featured',
    description: 'Return all featured instruction files (quality score 90+). These are verified, complete, and production-tested. Good starting point for finding high-quality instructions.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// --- Tool handlers ---

async function handleSearchRegistry({ q, category, min_quality, featured_only }) {
  const index = await fetchIndex();
  let results = index.entries || [];

  if (q) {
    const term = q.toLowerCase();
    results = results.filter(e =>
      e.title.toLowerCase().includes(term) ||
      (e.tags || []).some(t => t.toLowerCase().includes(term)) ||
      e.slug.toLowerCase().includes(term) ||
      e.category.toLowerCase().includes(term)
    );
  }
  if (category) results = results.filter(e => e.category === category);
  if (min_quality) results = results.filter(e => (e.quality_score || 0) >= min_quality);
  if (featured_only) results = results.filter(e => e.featured);

  if (results.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `No results found for your query. Try broader terms or use list_categories to see what's available.\n\nRegistry has ${index.count} total files across ${index.categories.length} categories.`
      }]
    };
  }

  const output = results.map(e => {
    const lines = [
      `**${e.title}**`,
      `slug: ${e.slug}`,
      `category: ${e.category}`,
      `quality: ${e.quality_score}/100${e.featured ? ' ★ featured' : ''}`,
      `tags: ${(e.tags || []).join(', ')}`,
      `url: ${e.url}`,
    ];
    return lines.join('\n');
  });

  return {
    content: [{
      type: 'text',
      text: `Found ${results.length} result${results.length === 1 ? '' : 's'}:\n\n${output.join('\n\n---\n\n')}\n\nUse get_instruction with the slug to fetch the full file.`
    }]
  };
}

async function handleGetInstruction({ slug, instruction_only }) {
  const markdown = await fetchFile(slug);

  if (instruction_only) {
    const instruction = extractInstruction(markdown);
    if (!instruction) {
      return {
        content: [{
          type: 'text',
          text: `Could not extract instruction from ${slug}. Returning full file instead:\n\n${markdown}`
        }]
      };
    }
    return {
      content: [{
        type: 'text',
        text: `# Instruction: ${slug}\n\n\`\`\`\n${instruction}\n\`\`\`\n\nFetched from: ${BASE_URL}/registry/${slug}.md`
      }]
    };
  }

  return {
    content: [{
      type: 'text',
      text: markdown
    }]
  };
}

async function handleListCategories() {
  const index = await fetchIndex();
  const entries = index.entries || [];

  const categoryInfo = {
    'system-prompts': 'Full agent identity and behavior definitions — the complete personality and rules for an agent',
    'skills': 'Scoped capability modules for specific tasks — drop into any agent to add a capability',
    'workflows': 'Multi-step sequential or conditional process instructions',
    'tool-definitions': 'Function schemas, API patterns, and tool usage instructions',
    'domain-packs': 'Deep field context — industry knowledge, terminology, and domain standards',
    'safety-filters': 'Output validation, content filtering, and harm detection patterns',
    'orchestration': 'Multi-agent coordination and handoff protocols'
  };

  const counts = {};
  for (const cat of index.categories) counts[cat] = 0;
  for (const e of entries) {
    if (counts[e.category] !== undefined) counts[e.category]++;
  }

  const lines = index.categories.map(cat => {
    const count = counts[cat] || 0;
    const desc = categoryInfo[cat] || '';
    return `**${cat}** (${count} file${count === 1 ? '' : 's'})\n  ${desc}`;
  });

  return {
    content: [{
      type: 'text',
      text: `OpenClaw Registry — ${index.count} total files\n\n${lines.join('\n\n')}\n\nUse search_registry with category filter to browse files in any category.`
    }]
  };
}

async function handleGetFeatured() {
  const index = await fetchIndex();
  const featured = (index.entries || []).filter(e => e.featured);

  const output = featured.map(e =>
    `**${e.title}** [${e.category}]\nslug: ${e.slug} | quality: ${e.quality_score}/100\ntags: ${(e.tags || []).join(', ')}`
  );

  return {
    content: [{
      type: 'text',
      text: `Featured files (${featured.length} total — quality score 90+):\n\n${output.join('\n\n')}\n\nUse get_instruction with any slug to fetch the full file.`
    }]
  };
}

// --- Server ---

const server = new Server(
  { name: 'openclaw', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_registry': return await handleSearchRegistry(args || {});
      case 'get_instruction': return await handleGetInstruction(args || {});
      case 'list_categories': return await handleListCategories();
      case 'get_featured': return await handleGetFeatured();
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
