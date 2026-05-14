import * as vscode from 'vscode'
import { logger } from '../utils/logger'

/**
 * Get decompiled Java class file source via jdt:// URI.
 *
 * @param uri - The jdt:// URI of the class file
 * @returns Raw source code text
 */
export async function getClassFileContents(uri: string): Promise<string> {
  try {
    if (!uri.startsWith('jdt://')) {
      throw new Error(`Invalid URI format, expected jdt:// prefix: ${uri}`)
    }

    logger.info(`Getting class file contents: ${uri}`)

    const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri))
    return doc.getText()
  }
  catch (error) {
    logger.error('Failed to get class file contents', error)
    throw error
  }
}
