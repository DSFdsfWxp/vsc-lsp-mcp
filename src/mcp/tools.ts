import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  getClassFileContents,
  getCompletions,
  getDeclarations,
  getDefinition,
  getDocumentSymbols,
  getHover,
  getImplementations,
  getIncomingCalls,
  getOutgoingCalls,
  getReferences,
  getWorkspaceSymbols,
  prepareCallHierarchy,
  rename,
} from '../lsp'

const ops = [
  'completions',
  'definition',
  'declaration',
  'implementation',
  'hover',
  'references',
  'document_symbols',
  'workspace_symbols',
  'class_file_contents',
  'rename',
  'symbol_at_position',
  'incoming_calls',
  'outgoing_calls',
] as const

const uriDesc = `File URI in encoded format:
- Windows: "file:///c%3A/path/to/file.ts" (drive letter + colon encoded as "%3A")
- Unix: "file:///home/user/file.ts"
Must start with "file:///" with URI-encoded special chars.
For "class_file_contents", use jdt:// URI instead.`

const toolDesc = `Execute an LSP operation.
Operations:
- completions: Code completion at position
- definition: Get definition of symbol at position
- declaration: Get declaration of symbol at position
- implementation: Get implementation of symbol at position
- hover: Get hover documentation at position
- references: Find all references of symbol at position
- document_symbols: Get symbol outline of the file (line/char ignored, pass any value)
- workspace_symbols: Search symbols across workspace by query (uri/line/char ignored, pass any value)
- class_file_contents: Decompile class from jdt:// URI (line/char ignored, pass any value; uri must be jdt://, see uriDesc)
- rename: Rename symbol across workspace (requires newName)
- symbol_at_position: Get symbol metadata (name, kind, range, file) at position
- incoming_calls: Get all callers of symbol at position
- outgoing_calls: Get all callees of symbol at position`

export function addLspTools(server: McpServer) {
  server.registerTool(
    'execute_lsp',
    {
      title: 'Execute LSP Operation',
      description: toolDesc,
      inputSchema: {
        operation: z.enum(ops).describe(`Which LSP operation to execute.`),
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
        newName: z.string().optional().describe('New symbol name. Required only for "rename".'),
        query: z.string().optional().describe('Search query. Required only for "workspace_symbols".'),
      },
    },
    async ({ operation, uri, line, character, newName, query }) => {
      let result: string

      switch (operation) {
        case 'completions':
          result = await getCompletions(uri, line, character)
          break
        case 'definition':
          result = await getDefinition(uri, line, character)
          break
        case 'declaration':
          result = await getDeclarations(uri, line, character)
          break
        case 'implementation':
          result = await getImplementations(uri, line, character)
          break
        case 'hover':
          result = await getHover(uri, line, character)
          break
        case 'references':
          result = await getReferences(uri, line, character)
          break
        case 'document_symbols':
          result = await getDocumentSymbols(uri)
          break
        case 'workspace_symbols':
          result = await getWorkspaceSymbols(query!)
          break
        case 'class_file_contents':
          result = await getClassFileContents(uri)
          break
        case 'rename':
          result = await rename(uri, line, character, newName!)
          break
        case 'symbol_at_position':
          result = await prepareCallHierarchy(uri, line, character)
          break
        case 'incoming_calls':
          result = await getIncomingCalls(uri, line, character)
          break
        case 'outgoing_calls':
          result = await getOutgoingCalls(uri, line, character)
          break
      }

      return { content: [{ type: 'text', text: result }] }
    },
  )
}
