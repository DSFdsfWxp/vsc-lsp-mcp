import * as vscode from 'vscode'
import { logger } from '../utils/logger'
import { getDocument } from './tools'
import { formatCallHierarchyItems, formatIncomingCalls, formatOutgoingCalls } from './formatter'

/**
 * Prepare call hierarchy at a given position, returned as a JSON string.
 *
 * @param uri - The document URI
 * @param line - Line number (0-based)
 * @param character - Character offset (0-based)
 * @returns JSON string of call hierarchy items
 */
export async function prepareCallHierarchy(
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

    logger.info(`Preparing call hierarchy: ${uri} line:${line} col:${character}`)

    const items = await vscode.commands.executeCommand<
      vscode.CallHierarchyItem | vscode.CallHierarchyItem[]
    >(
      'vscode.prepareCallHierarchy',
      document.uri,
      position,
    )

    if (!items) {
      return JSON.stringify([])
    }

    return formatCallHierarchyItems(Array.isArray(items) ? items : [items])
  }
  catch (error) {
    logger.error('Failed to prepare call hierarchy', error)
    throw error
  }
}

/**
 * Get incoming calls (callers) for a symbol at a given position, returned as a JSON string.
 * Internally calls prepareCallHierarchy first, then provideIncomingCalls for each item.
 *
 * @param uri - The document URI
 * @param line - Line number (0-based)
 * @param character - Character offset (0-based)
 * @returns JSON string of incoming calls
 */
export async function getIncomingCalls(
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

    logger.info(`Getting incoming calls: ${uri} line:${line} col:${character}`)

    const items = await vscode.commands.executeCommand<
      vscode.CallHierarchyItem | vscode.CallHierarchyItem[]
    >(
      'vscode.prepareCallHierarchy',
      document.uri,
      position,
    )

    if (!items) {
      return JSON.stringify([])
    }

    const itemList = Array.isArray(items) ? items : [items]
    const allCalls: vscode.CallHierarchyIncomingCall[] = []

    for (const item of itemList) {
      const calls = await vscode.commands.executeCommand<vscode.CallHierarchyIncomingCall[]>(
        'vscode.provideIncomingCalls',
        item,
      )
      if (calls) {
        allCalls.push(...calls)
      }
    }

    return formatIncomingCalls(allCalls)
  }
  catch (error) {
    logger.error('Failed to get incoming calls', error)
    throw error
  }
}

/**
 * Get outgoing calls (callees) for a symbol at a given position, returned as a JSON string.
 * Internally calls prepareCallHierarchy first, then provideOutgoingCalls for each item.
 *
 * @param uri - The document URI
 * @param line - Line number (0-based)
 * @param character - Character offset (0-based)
 * @returns JSON string of outgoing calls
 */
export async function getOutgoingCalls(
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

    logger.info(`Getting outgoing calls: ${uri} line:${line} col:${character}`)

    const items = await vscode.commands.executeCommand<
      vscode.CallHierarchyItem | vscode.CallHierarchyItem[]
    >(
      'vscode.prepareCallHierarchy',
      document.uri,
      position,
    )

    if (!items) {
      return JSON.stringify([])
    }

    const itemList = Array.isArray(items) ? items : [items]
    const allCalls: vscode.CallHierarchyOutgoingCall[] = []

    for (const item of itemList) {
      const calls = await vscode.commands.executeCommand<vscode.CallHierarchyOutgoingCall[]>(
        'vscode.provideOutgoingCalls',
        item,
      )
      if (calls) {
        allCalls.push(...calls)
      }
    }

    return formatOutgoingCalls(allCalls)
  }
  catch (error) {
    logger.error('Failed to get outgoing calls', error)
    throw error
  }
}
