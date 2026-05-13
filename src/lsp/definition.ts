import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { getDocument } from './tools'
import { formatLocations } from './formatter'

/**
 * Get the definition location of a symbol, returned as a JSON string.
 *
 * @param uri - The document URI
 * @param line - Line number (0-based)
 * @param character - Character offset (0-based)
 * @returns JSON string of definition locations
 */
export async function getDefinition(
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

    logger.info(`Getting definition: ${uri} line:${line} col:${character}`)

    const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeDefinitionProvider',
      document.uri,
      position,
    )

    return formatLocations(definitions || [])
  }
  catch (error) {
    logger.error('Failed to get definition', error)
    throw error
  }
}
