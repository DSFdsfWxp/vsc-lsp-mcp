import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { getDocument } from './tools'
import { formatRename } from './formatter'

/**
 * Rename a symbol across the workspace, returned as a JSON summary string.
 * Does NOT list every individual edit to avoid overflowing context window.
 *
 * @param uri - The document URI
 * @param line - Line number (0-based)
 * @param character - Character offset (0-based)
 * @param newName - The new name for the symbol
 * @returns JSON string with rename summary
 */
export async function rename(
  uri: string,
  line: number,
  character: number,
  newName: string,
): Promise<string> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`Failed to find document: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.info(`Renaming: ${uri} line:${line} col:${character} newName:${newName}`)

    const canRename = await vscode.commands.executeCommand<vscode.Range | {
      range: vscode.Range
      placeholder: string
    }>(
      'vscode.prepareRename',
      document.uri,
      position,
    )

    if (!canRename) {
      throw new Error('Rename is not supported at this position')
    }

    const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
      'vscode.executeDocumentRenameProvider',
      document.uri,
      position,
      newName,
    )

    if (!edit) {
      throw new Error('Rename returned no changes')
    }

    await vscode.workspace.applyEdit(edit)

    return formatRename(edit, newName)
  }
  catch (error) {
    logger.error('Failed to rename symbol', error)
    throw error
  }
}
