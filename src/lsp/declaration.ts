import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { getDocument } from './tools'
import { formatLocationsOrLinks } from './formatter'

/**
 * Get the declaration location of a symbol, returned as a JSON string.
 *
 * @param uri - The document URI
 * @param line - Line number (0-based)
 * @param character - Character offset (0-based)
 * @returns JSON string of declaration locations
 */
export async function getDeclarations(
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

    logger.info(`Getting declarations: ${uri} line:${line} col:${character}`)

    const result = await vscode.commands.executeCommand<
      vscode.Location | vscode.Location[] | vscode.LocationLink[]
    >(
      'vscode.executeDeclarationProvider',
      document.uri,
      position,
    )

    if (!result) {
      return JSON.stringify([])
    }

    return formatLocationsOrLinks(result)
  }
  catch (error) {
    logger.error('Failed to get declarations', error)
    throw error
  }
}
