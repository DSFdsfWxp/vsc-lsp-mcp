import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { formatClassFile } from './formatter'

/**
 * Get decompiled Java class file source via jdt:// URI, returned as a JSON string.
 *
 * @param uri - The jdt:// URI of the class file
 * @returns JSON string with language hint and source code
 */
export async function getClassFileContents(uri: string): Promise<string> {
  try {
    if (!uri.startsWith('jdt://')) {
      throw new Error(`Invalid URI format, expected jdt:// prefix: ${uri}`)
    }

    logger.info(`Getting class file contents: ${uri}`)

    const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri))
    return formatClassFile(doc.getText())
  }
  catch (error) {
    logger.error('Failed to get class file contents', error)
    throw error
  }
}
