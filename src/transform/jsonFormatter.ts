import type { Formatter } from './types'

/**
 * JsonFormatter converts flattened LSP data into JSON strings.
 * Serialisation is kept here in the formatter; callers work with flattened objects only.
 */
export class JsonFormatter implements Formatter {
  formatHover(contents: string[]): string {
    return JSON.stringify(contents)
  }

  formatCompletions(items: Record<string, any>[]): string {
    return JSON.stringify(items)
  }

  formatLocations(locations: Record<string, any>[]): string {
    return JSON.stringify(locations)
  }

  formatRename(result: Record<string, any>): string {
    return JSON.stringify(result)
  }

  formatClassFile(text: string): string {
    return JSON.stringify({ language: 'java', source: text })
  }

  formatDocumentSymbols(symbols: Record<string, any>[]): string {
    return JSON.stringify(symbols)
  }

  formatWorkspaceSymbols(symbols: Record<string, any>[]): string {
    return JSON.stringify(symbols)
  }

  formatCallHierarchyItems(items: Record<string, any>[]): string {
    return JSON.stringify(items)
  }

  formatIncomingCalls(calls: Record<string, any>[]): string {
    return JSON.stringify(calls)
  }

  formatOutgoingCalls(calls: Record<string, any>[]): string {
    return JSON.stringify(calls)
  }
}
