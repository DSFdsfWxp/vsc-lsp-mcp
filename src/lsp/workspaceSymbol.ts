import * as vscode from 'vscode'
import { logger } from '../utils/logger'

/**
 * Search for symbols across the entire workspace.
 *
 * @param query - Search query string
 * @returns Raw VSCode SymbolInformation array
 */
export async function getWorkspaceSymbols(
  query: string,
): Promise<vscode.SymbolInformation[]> {
  try {
    logger.info(`Searching workspace symbols: ${query}`)

    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
      'vscode.executeWorkspaceSymbolProvider',
      query,
    )

    return symbols || []
  }
  catch (error) {
    logger.error('Failed to get workspace symbols', error)
    throw error
  }
}
