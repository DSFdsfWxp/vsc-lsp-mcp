import { TransformService } from './pipeline'

/** Singleton pipeline instance. Reads output format from VSCode settings. */
export const transform = new TransformService()
