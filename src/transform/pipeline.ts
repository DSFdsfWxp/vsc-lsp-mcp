import * as vscode from 'vscode'
import type { Formatter } from './types'
import { JsonFormatter } from './jsonFormatter'
import { MarkdownFormatter } from './markdownFormatter'
import {
  flattenLocation,
  flattenLocationLink,
  flattenSymbol,
  flattenWorkspaceSymbols,
  flattenCallHierarchyItem,
  flattenIncomingCall,
  flattenOutgoingCall,
  extractContentText,
  flattenLabel,
  kindNames,
} from './flatten'

/**
 * TransformService is the pipeline entry-point for all formatting operations.
 *
 * Data flow:
 *   raw VSCode API value  →  flatten  →  format (JSON or Markdown)
 *
 * - **flatten**: Converts VSCode-API-specific types (Location, Hover, CompletionList, etc.)
 *   into plain JSON-compatible objects (Record<string, any>). This strips type wrappers,
 *   resolves URIs to file paths, enumerates numeric kind values to human-readable names,
 *   and discards fields that are irrelevant for output (tags, targetSelectionRange, etc.).
 *   All flatten logic lives in flatten.ts.
 *
 * - **format**: Serialises the already-flattened plain objects into a final string.
 *   Two implementations exist: JsonFormatter (JSON.stringify) and MarkdownFormatter
 *   (LLM-friendly bullet-oriented Markdown). The format layer never touches VSCode types.
 *
 * The active formatter is determined by the `lsp-mcp.outputFormat` configuration.
 * It is cached and only recreated when the setting changes.
 */
export class TransformService {
  private _formatter: Formatter | null = null
  private _lastFormat: string | null = null

  private _getFormatter(): Formatter {
    const format = vscode.workspace.getConfiguration('lsp-mcp').get<string>('outputFormat', 'json')
    if (format !== this._lastFormat || !this._formatter) {
      this._lastFormat = format
      this._formatter = format === 'markdown' ? new MarkdownFormatter() : new JsonFormatter()
    }
    return this._formatter
  }

  formatHover(hovers: vscode.Hover[]): string {
    const contents = hovers.map((h) =>
      h.contents.map(extractContentText).filter(Boolean).join('\n\n').trim(),
    ).filter(Boolean)
    return this._getFormatter().formatHover(contents)
  }

  formatCompletions(list: vscode.CompletionList): string {
    const items = list.items.map((item) => ({
      label: flattenLabel(item.label),
      kind: item.kind !== undefined ? (kindNames[item.kind] ?? 'Unknown') : undefined,
      detail: item.detail || undefined,
    }))
    return this._getFormatter().formatCompletions(items)
  }

  formatLocations(locations: vscode.Location[]): string {
    return this._getFormatter().formatLocations(locations.map(flattenLocation))
  }

  formatLocationsOrLinks(
    items: vscode.Location | vscode.Location[] | vscode.LocationLink[],
  ): string {
    if (Array.isArray(items)) {
      if (items.length === 0) return this._getFormatter().formatLocations([])
      if ('targetUri' in items[0]) {
        return this._getFormatter().formatLocations(
          (items as vscode.LocationLink[]).map(flattenLocationLink),
        )
      }
      return this._getFormatter().formatLocations(
        (items as vscode.Location[]).map(flattenLocation),
      )
    }
    return this._getFormatter().formatLocations([flattenLocation(items)])
  }

  formatRename(edit: vscode.WorkspaceEdit, newName: string): string {
    let filesChanged = 0
    let totalEdits = 0
    for (const [, textEdits] of edit.entries()) {
      if (textEdits.length > 0) filesChanged++
      totalEdits += textEdits.length
    }
    return this._getFormatter().formatRename({
      success: true,
      newName,
      filesChanged,
      totalEdits,
    })
  }

  formatClassFile(text: string): string {
    return this._getFormatter().formatClassFile(text)
  }

  formatDocumentSymbols(
    symbols: (vscode.DocumentSymbol | vscode.SymbolInformation)[],
  ): string {
    return this._getFormatter().formatDocumentSymbols(symbols.map(sym => flattenSymbol(sym, true)))
  }

  async formatWorkspaceSymbols(symbols: vscode.SymbolInformation[]): Promise<string> {
    return this._getFormatter().formatWorkspaceSymbols(await flattenWorkspaceSymbols(symbols))
  }

  formatCallHierarchyItems(items: vscode.CallHierarchyItem[]): string {
    return this._getFormatter().formatCallHierarchyItems(items.map(flattenCallHierarchyItem))
  }

  formatIncomingCalls(calls: vscode.CallHierarchyIncomingCall[]): string {
    return this._getFormatter().formatIncomingCalls(calls.map(flattenIncomingCall))
  }

  formatOutgoingCalls(calls: vscode.CallHierarchyOutgoingCall[]): string {
    return this._getFormatter().formatOutgoingCalls(calls.map(flattenOutgoingCall))
  }
}
