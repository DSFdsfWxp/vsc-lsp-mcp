import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { getDocument } from './tools'
import { formatDocumentSymbols } from './formatter'

/**
 * Get document symbols (outline) for a file, returned as a JSON string.
 *
 * @param uri - The document URI
 * @returns JSON string of document symbols
 */
export async function getDocumentSymbols(uri: string): Promise<string> {
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

    return formatDocumentSymbols(symbols || [])
  }
  catch (error) {
    logger.error('Failed to get document symbols', error)
    throw error
  }
}
