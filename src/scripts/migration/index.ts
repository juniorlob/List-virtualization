/**
 * Migration module exports
 */

export { MigrationCoordinator } from './coordinator.js';
export {
  FileDiscovery,
  discoverFiles,
  type FileDiscoveryOptions,
} from './file-discovery.js';
export {
  DefaultImportMatcher,
  createImportMatcher,
  extractImportPath,
  type ImportMatcher,
} from './import-matcher.js';
export {
  DefaultImportOrganizer,
  createImportOrganizer,
  organizeFileImports,
  type ImportOrganizer,
} from './import-organizer.js';
export {
  MigrationValidator,
  createValidator,
} from './validator.js';
export type {
  Layer,
  ImportGroup,
  ImportStatement,
  ProcessResult,
  ImportTransformation,
  FileTransformation,
  ValidationResult,
  MigrationReport,
  MigrationConfig,
  MigrationOptions,
} from './types.js';
