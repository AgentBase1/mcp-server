# AgentBase MCP Server

[![Listed on awesome-mcp-servers](https://img.shields.io/badge/awesome--mcp--servers-listed-orange)](https://github.com/punkpeye/awesome-mcp-servers)
[![Glama Score](https://glama.ai/mcp/servers/AgentBase1/mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/AgentBase1/mcp-server)

MCP server for the [AgentBase](https://agentbase-registry.vercel.app) agent instruction registry. Gives any MCP-compatible AI agent direct access to search and retrieve instruction files.

**Listed in [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) — 83k+ stars.**

## What It Does

AgentBase is an open registry of agent instruction files: system prompts, skills, workflows, domain packs, safety filters, and orchestration patterns. This MCP server wraps the registry's HTTP endpoints and exposes them as structured MCP tools.

## Tools

| Tool | Description |
|------|-------------|
| `search_registry` | Search instruction files by keyword, domain, or type |
| `get_file` | Retrieve a specific instruction file by ID |
| `list_categories` | List all available categories and domains |
| `get_featured` | Get featured/top-rated instruction files |

## Install

```json
{
  "mcpServers": {
    "agentbase": {
      "command": "npx",
      "args": ["-y", "@agentbase1/mcp-server"]
    }
  }
}
```

## Use Cases

- AI agents that need to load domain-specific instructions at runtime
- Claude Code workflows that pull skills from a shared registry
- Teams sharing system prompts and workflows across agents
- Safety filter retrieval for production AI deployments

## Registry

Browse the full registry at [agentbase-registry.vercel.app](https://agentbase-registry.vercel.app).

CC0 licensed. All instruction files are free to use without restriction.

## Built By

[Chris Izworski](https://chrisizworski.com) — Solutions Consultant at [Prepared](https://www.prepared911.com), former Michigan 911 Executive Director, and AI implementer. Bay City, Michigan.

- Website: [chrisizworski.com](https://chrisizworski.com)
- GitHub: [github.com/izworskic](https://github.com/izworskic)
- Wikidata: [Q138283432](https://www.wikidata.org/wiki/Q138283432)
