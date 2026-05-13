import * as vscode from 'vscode'

const kindNames: Record<number, string> = {
  [vscode.CompletionItemKind.Text]: 'Text',
  [vscode.CompletionItemKind.Method]: 'Method',
  [vscode.CompletionItemKind.Function]: 'Function',
  [vscode.CompletionItemKind.Constructor]: 'Constructor',
  [vscode.CompletionItemKind.Field]: 'Field',
  [vscode.CompletionItemKind.Variable]: 'Variable',
  [vscode.CompletionItemKind.Class]: 'Class',
  [vscode.CompletionItemKind.Interface]: 'Interface',
  [vscode.CompletionItemKind.Module]: 'Module',
  [vscode.CompletionItemKind.Property]: 'Property',
  [vscode.CompletionItemKind.Unit]: 'Unit',
  [vscode.CompletionItemKind.Value]: 'Value',
  [vscode.CompletionItemKind.Enum]: 'Enum',
  [vscode.CompletionItemKind.Keyword]: 'Keyword',
  [vscode.CompletionItemKind.Snippet]: 'Snippet',
  [vscode.CompletionItemKind.Color]: 'Color',
  [vscode.CompletionItemKind.Reference]: 'Reference',
  [vscode.CompletionItemKind.File]: 'File',
  [vscode.CompletionItemKind.Folder]: 'Folder',
  [vscode.CompletionItemKind.EnumMember]: 'EnumMember',
  [vscode.CompletionItemKind.Constant]: 'Constant',
  [vscode.CompletionItemKind.Struct]: 'Struct',
  [vscode.CompletionItemKind.Event]: 'Event',
  [vscode.CompletionItemKind.Operator]: 'Operator',
  [vscode.CompletionItemKind.TypeParameter]: 'TypeParameter',
  [vscode.CompletionItemKind.User]: 'User',
  [vscode.CompletionItemKind.Issue]: 'Issue',
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
 * Format Hover[] into a clean JSON string.
 * Keeps: content text, source range.
 * Strips: MarkdownString/MarkedString type wrappers.
 *
 * @param hovers - List of hover data
 * @returns JSON string
 */
export function formatHover(hovers: vscode.Hover[]): string {
  if (hovers.length === 0) {
    return JSON.stringify([])
  }

  const result = hovers.map((hover) => ({
    range: hover.range
      ? {
          start: { line: hover.range.start.line, character: hover.range.start.character },
          end: { line: hover.range.end.line, character: hover.range.end.character },
        }
      : undefined,
    contents: hover.contents.map(extractContentText).filter(Boolean),
  }))

  return JSON.stringify(result)
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

  const result = list.items.map((item) => ({
    label: flattenLabel(item.label),
    kind: item.kind !== undefined ? (kindNames[item.kind] ?? 'Unknown') : undefined,
    detail: item.detail || undefined,
  }))

  return JSON.stringify(result)
}

/**
 * Format Location[] into a clean JSON string.
 * Keeps: file path, start line + character.
 * Strips: end position (usually not needed for LLM context).
 *
 * @param locations - List of locations
 * @returns JSON string
 */
export function formatLocations(locations: vscode.Location[]): string {
  if (locations.length === 0) {
    return JSON.stringify([])
  }

  const result = locations.map((loc) => ({
    file: loc.uri.fsPath || loc.uri.toString(),
    line: loc.range.start.line,
    character: loc.range.start.character,
  }))

  return JSON.stringify(result)
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
  const entries = edit.entries()
  let filesChanged = 0
  let totalEdits = 0

  for (const [, textEdits] of entries) {
    if (textEdits.length > 0) filesChanged++
    totalEdits += textEdits.length
  }

  return JSON.stringify({
    success: true,
    newName,
    filesChanged,
    totalEdits,
  })
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
