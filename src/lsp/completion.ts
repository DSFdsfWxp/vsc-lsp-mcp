import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { getDocument } from './tools'
import { formatCompletions } from './formatter'

/**
 * Get code completion suggestions at a given position, returned as a JSON string.
 *
 * @param uri - The document URI
 * @param line - Line number (0-based)
 * @param character - Character offset (0-based)
 * @returns JSON string of completion items
 */
export async function getCompletions(
  uri: string,
  line: number,
  character: number,
): Promise<string> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`Failed to find document: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.info(`Getting completions: ${uri} line:${line} col:${character}`)

    const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      document.uri,
      position,
      undefined,
      30,
    )

    return formatCompletions(completionList)
  }
  catch (error) {
    logger.error('Failed to get completions', error)
    throw error
  }
}
