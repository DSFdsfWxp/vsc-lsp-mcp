import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { formatWorkspaceSymbols } from './formatter'

/**
 * Search for symbols across the entire workspace, returned as a JSON string.
 *
 * @param query - Search query string
 * @returns JSON string of matching workspace symbols
 */
export async function getWorkspaceSymbols(query: string): Promise<string> {
  try {
    logger.info(`Searching workspace symbols: ${query}`)

    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
      'vscode.executeWorkspaceSymbolProvider',
      query,
    )

    return formatWorkspaceSymbols(symbols || [])
  }
  catch (error) {
    logger.error('Failed to get workspace symbols', error)
    throw error
  }
}
