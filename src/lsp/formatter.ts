import * as vscode from 'vscode'

/**
 * Build a value-to-name map from a TypeScript numeric enum
 *
 * @param enumObj - A TypeScript numeric enum object
 * @returns Record mapping numeric values to their string names
 */
function generateEnumNameMap<T extends Record<string, string | number>>(enumObj: T): Record<number, string> {
  return Object.fromEntries(
    Object.entries(enumObj)
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => [v, k]),
  ) as Record<number, string>
}

const kindNames = generateEnumNameMap(vscode.CompletionItemKind)
const symbolKindNames = generateEnumNameMap(vscode.SymbolKind)

/**
 * Convert a VSCode Range to a compact string pair
 *
 * @param range - VSCode Range
 * @returns string with "line:char" sub strings for start and end
 */
function formatRange(range: vscode.Range): string {
  return `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`
}

/**
 * Resolve a URI to its file system path string
 *
 * @param uri - VSCode Uri
 * @returns File path string
 */
function getFile(uri: vscode.Uri): string {
  return uri.fsPath || uri.toString()
}

/**
 * Flatten a Location to a plain object
 *
 * @param loc - VSCode Location
 * @returns Plain object with file, line, character
 */
function flattenLocation(loc: vscode.Location): Record<string, any> {
  return {
    file: getFile(loc.uri),
    range: formatRange(loc.range),
  }
}

/**
 * Flatten a LocationLink to a plain object (full range + optional origin)
 *
 * @param link - VSCode LocationLink
 * @returns Plain object with file, range, and optional originSelectionRange
 */
function flattenLocationLink(link: vscode.LocationLink): Record<string, any> {
  return {
    file: getFile(link.targetUri),
    range: formatRange(link.targetRange),
    // maybe useless
    //...(link.originSelectionRange ? { originSelectionRange: formatRange(link.originSelectionRange) } : {}),
  }
}

/**
 * Extract plain text from hover content item
 *
 * @param content - Hover content which may be MarkdownString, plain string, or MarkedString
 * @returns Extracted text content
 */
function extractContentText(content: vscode.MarkdownString | vscode.MarkedString): string {
  if (typeof content === 'string') {
    return content
  }
  if (content instanceof vscode.MarkdownString) {
    return content.value
  }
  return content.value
}

/**
 * Flatten completion item label into a single string
 *
 * @param label - Completion item label which may be string or CompletionItemLabel
 * @returns Flattened label text
 */
function flattenLabel(label: string | vscode.CompletionItemLabel): string {
  if (typeof label === 'string') return label
  let result = label.label
  if (label.detail) result += label.detail
  if (label.description) result += ` (${label.description})`
  return result
}

/**
 * Format Hover[] into a clean JSON string.
 * Keeps: content text.
 * Strips: range, MarkdownString/MarkedString type wrappers.
 *
 * @param hovers - List of hover data
 * @returns JSON string
 */
export function formatHover(hovers: vscode.Hover[]): string {
  if (hovers.length === 0) {
    return JSON.stringify([])
  }

  return JSON.stringify(
    hovers.map((hover) => 
      hover.contents.map(extractContentText).filter(Boolean).join('\n\n').trim(),
    ),
  )
}

/**
 * Format CompletionList into a clean JSON string.
 * Keeps: label, kind, detail.
 * Strips: documentation, insertText, textEdit, sortText, filterText, command, range, etc.
 *
 * @param list - Completion list
 * @returns JSON string
 */
export function formatCompletions(list: vscode.CompletionList): string {
  if (!list || list.items.length === 0) {
    return JSON.stringify([])
  }

  return JSON.stringify(
    list.items.map((item) => ({
      label: flattenLabel(item.label),
      kind: item.kind !== undefined ? (kindNames[item.kind] ?? 'Unknown') : undefined,
      detail: item.detail || undefined,
    })),
  )
}

/**
 * Format Location[] into a clean JSON string.
 * Keeps: file, range (start + end).
 *
 * @param locations - List of locations
 * @returns JSON string
 */
export function formatLocations(locations: vscode.Location[]): string {
  if (locations.length === 0) {
    return JSON.stringify([])
  }
  return JSON.stringify(locations.map(flattenLocation))
}

/**
 * Format Location | Location[] | LocationLink[] into a clean JSON string.
 * Keeps: file, target range, origin selection range (LocationLink only).
 * Strips: targetSelectionRange (LocationLink).
 *
 * @param items - A single Location, Location array, or LocationLink array
 * @returns JSON string
 */
export function formatLocationsOrLinks(items: vscode.Location | vscode.Location[] | vscode.LocationLink[]): string {
  if (Array.isArray(items)) {
    if (items.length === 0) return JSON.stringify([])
    if ('targetUri' in items[0]) {
      return JSON.stringify((items as vscode.LocationLink[]).map(flattenLocationLink))
    }
    return JSON.stringify((items as vscode.Location[]).map(flattenLocation))
  }
  return JSON.stringify([flattenLocation(items)])
}

/**
 * Format rename result into a concise JSON summary.
 * Does NOT list every edit to avoid overflowing context window.
 *
 * @param edit - Workspace edit returned by rename provider
 * @param newName - The new symbol name
 * @returns JSON string
 */
export function formatRename(edit: vscode.WorkspaceEdit, newName: string): string {
  let filesChanged = 0
  let totalEdits = 0

  for (const [, textEdits] of edit.entries()) {
    if (textEdits.length > 0) filesChanged++
    totalEdits += textEdits.length
  }

  return JSON.stringify({ success: true, newName, filesChanged, totalEdits })
}

/**
 * Format Java source code into JSON with language hint
 *
 * @param text - Source code text
 * @returns JSON string
 */
export function formatClassFile(text: string): string {
  return JSON.stringify({ language: 'java', source: text })
}

/**
 * Recursively flatten a symbol (SymbolInformation or DocumentSymbol) into a plain object
 * Keeps: name, kind, containerName, range, detail, children, namePosition (DocumentSymbol).
 * Strips: tags, file (SymbolInformation — file is implicit from the queried document).
 *
 * @param symbol - A DocumentSymbol or SymbolInformation instance
 * @returns Plain object with name, kind, location info, and optional children
 */
function flattenSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): Record<string, any> {
  const base: Record<string, any> = {
    name: symbol.name,
    kind: symbolKindNames[symbol.kind] ?? 'Unknown',
  }

  if ('location' in symbol) {
    base.range = formatRange(symbol.location.range)
    if (symbol.containerName) base.containerName = symbol.containerName
  }

  if ('detail' in symbol) {
    if (symbol.detail) base.detail = symbol.detail
    base.range = formatRange(symbol.range)
    base.namePosition = formatRange(symbol.selectionRange).split('-')[0]
  }

  if ('children' in symbol && symbol.children.length > 0) {
    base.children = symbol.children.map(flattenSymbol)
  }

  return base
}

/**
 * Format DocumentSymbol[] / SymbolInformation[] into a clean JSON string.
 * Strips: file (file is implicit from the queried document), tags.
 *
 * @param symbols - Array of DocumentSymbol or SymbolInformation
 * @returns JSON string
 */
export function formatDocumentSymbols(symbols: (vscode.SymbolInformation | vscode.DocumentSymbol)[]): string {
  if (symbols.length === 0) return JSON.stringify([])
  return JSON.stringify(symbols.map(flattenSymbol))
}

/**
 * Format SymbolInformation[] from workspace symbol provider into a clean JSON string.
 * Keeps: name, kind, containerName, file, range.
 * Strips: tags.
 *
 * @param symbols - Array of SymbolInformation
 * @returns JSON string
 */
export function formatWorkspaceSymbols(symbols: vscode.SymbolInformation[]): string {
  if (symbols.length === 0) return JSON.stringify([])

  return JSON.stringify(
    symbols.map((s) => ({
      name: s.name,
      kind: symbolKindNames[s.kind] ?? 'Unknown',
      containerName: s.containerName || undefined,
      ...flattenLocation(s.location),
    })),
  )
}

/**
 * Flatten a CallHierarchyItem into a plain object
 * Keeps: name, kind, detail, file, range, namePosition.
 * Strips: tags.
 *
 * @param item - VSCode CallHierarchyItem
 * @returns Plain object with name, kind, detail, file, range, namePosition
 */
function flattenCallHierarchyItem(item: vscode.CallHierarchyItem): Record<string, any> {
  return {
    name: item.name,
    kind: symbolKindNames[item.kind] ?? 'Unknown',
    detail: item.detail || undefined,
    file: getFile(item.uri),
    range: formatRange(item.range),
    namePosition: formatRange(item.selectionRange).split('-')[0]
  }
}

/**
 * Format CallHierarchyItem[] into a clean JSON string.
 * Strips: tags.
 *
 * @param items - Array of CallHierarchyItem
 * @returns JSON string
 */
export function formatCallHierarchyItems(items: vscode.CallHierarchyItem[]): string {
  if (items.length === 0) return JSON.stringify([])
  return JSON.stringify(items.map(flattenCallHierarchyItem))
}

/**
 * Flatten a CallHierarchyIncomingCall into a plain object
 *
 * @param call - VSCode CallHierarchyIncomingCall
 * @returns Plain object with caller info and call site ranges
 */
function flattenIncomingCall(call: vscode.CallHierarchyIncomingCall): Record<string, any> {
  return {
    caller: flattenCallHierarchyItem(call.from),
    callSites: call.fromRanges.map(formatRange),
  }
}

/**
 * Format CallHierarchyIncomingCall[] into a clean JSON string.
 * Each entry: caller (flattened CallHierarchyItem), callSites.
 *
 * @param calls - Array of incoming calls
 * @returns JSON string
 */
export function formatIncomingCalls(calls: vscode.CallHierarchyIncomingCall[]): string {
  if (calls.length === 0) return JSON.stringify([])
  return JSON.stringify(calls.map(flattenIncomingCall))
}

/**
 * Flatten a CallHierarchyOutgoingCall into a plain object
 *
 * @param call - VSCode CallHierarchyOutgoingCall
 * @returns Plain object with callee info and call site ranges
 */
function flattenOutgoingCall(call: vscode.CallHierarchyOutgoingCall): Record<string, any> {
  return {
    callee: flattenCallHierarchyItem(call.to),
    callSites: call.fromRanges.map(formatRange),
  }
}

/**
 * Format CallHierarchyOutgoingCall[] into a clean JSON string.
 * Each entry: callee (flattened CallHierarchyItem), callSites.
 *
 * @param calls - Array of outgoing calls
 * @returns JSON string
 */
export function formatOutgoingCalls(calls: vscode.CallHierarchyOutgoingCall[]): string {
  if (calls.length === 0) return JSON.stringify([])
  return JSON.stringify(calls.map(flattenOutgoingCall))
}
