import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { getDocument } from './tools'

/**
 * Get document symbols (outline) for a file.
 *
 * @param uri - The document URI
 * @returns Raw VSCode SymbolInformation[] or DocumentSymbol[]
 */
export async function getDocumentSymbols(
  uri: string,
): Promise<(vscode.SymbolInformation | vscode.DocumentSymbol)[]> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`Failed to find document: ${uri}`)
    }

    logger.info(`Getting document symbols: ${uri}`)

    const symbols = await vscode.commands.executeCommand<(
      vscode.SymbolInformation[] | vscode.DocumentSymbol[]
    )>(
      'vscode.executeDocumentSymbolProvider',
      document.uri,
    )

    return symbols || []
  }
  catch (error) {
    logger.error('Failed to get document symbols', error)
    throw error
  }
}
