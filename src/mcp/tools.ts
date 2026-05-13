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

const uriDesc = `URI or absolute file path.
- Plain path (no scheme): treated as absolute file path on disk, e.g. "/home/user/file.ts" or "C:/path/to/file.ts". Recommended for all file operations.
- URI with scheme (e.g. file://, jdt://): parsed directly. Scheme part is case-insensitive, path requires proper percent-encoding. Do NOT construct file:// URIs manually.
- For "class_file_contents": must be a jdt:// URI (scheme "jdt:").`

const toolDesc = `Execute an LSP operation.
Operations:
- completions: Code completion at position
- definition: Get definition of symbol at position
- declaration: Get declaration of symbol at position
- implementation: Get implementation of symbol at position
- hover: Get hover documentation at position
- references: Find all references of symbol at position
- document_symbols: Get symbol outline of the file (position ignored, pass e.g. "0:0")
- workspace_symbols: Search symbols across workspace by query (uri/position ignored, pass any value)
- class_file_contents: Get decompiled source code of a Java class file via jdt:// URI. Use this to retrieve the source of library/dependency classes that jdtls references. The jdt:// URI is typically obtained from definition or hover results. (position ignored, pass e.g. "0:0"; uri must be jdt://)
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
        position: z.string().describe('Line:character (both 0-based), e.g. "42:5".'),
        newName: z.string().optional().describe('New symbol name. Required only for "rename".'),
        query: z.string().optional().describe('Search query. Required only for "workspace_symbols".'),
      },
    },
    async ({ operation, uri, position, newName, query }) => {
      const [line, character] = position.split(':').map(Number)
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
