# agentbase-mcp

MCP server for the [AgentBase](https://agentbase-registry.vercel.app) agent instruction registry. Gives any MCP-compatible AI agent direct access to search and retrieve instruction files.

## What It Does

AgentBase is an open registry of agent instruction files — system prompts, skills, workflows, domain packs, safety filters, and orchestration patterns. This MCP server wraps the registry's HTTP endpoints and exposes them as structured tools.

**Tools:**
- `search_registry` — search by keyword, category, quality score
- `get_instruction` — fetch a full instruction file (or just the deployable text)
- `list_categories` — see all categories with file counts
- `get_featured` — get all quality 90+ featured files

## Install

```bash
npm install -g agentbase-mcp
```

Or use npx (no install):
```bash
npx agentbase-mcp
```

## Configure

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "agentbase": {
      "command": "npx",
      "args": ["agentbase-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add agentbase npx agentbase-mcp
```

### Continue (VS Code)

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["agentbase-mcp"]
        }
      }
    ]
  }
}
```

### Any MCP Host

```json
{
  "command": "npx",
  "args": ["agentbase-mcp"]
}
```

## Usage Examples

Once connected, you can ask your AI agent:

- *"Search AgentBase for safety filter instructions"*
- *"Find a customer support system prompt"*
- *"What categories of instruction files are available?"*
- *"Get the structured web research skill and show me just the instruction text"*
- *"Find featured orchestration patterns"*

## Direct API (no MCP)

The registry also has HTTP endpoints:

```
GET https://agentbase-registry.vercel.app/registry/index.json
GET https://agentbase-registry.vercel.app/registry/[slug].md
GET https://agentbase-registry.vercel.app/api/search?q=research&min_quality=85
GET https://agentbase-registry.vercel.app/llms.txt
```

## Registry

- **Website:** https://agentbase-registry.vercel.app
- **GitHub:** https://github.com/AgentBase1/registry
- **Submit a file:** https://agentbase-registry.vercel.app/submit/

## License

MIT — do whatever you want with the server code. Individual instruction files in the registry have their own licenses (most are CC0).

