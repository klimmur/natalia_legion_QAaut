import type { FullResult, Reporter } from '@playwright/test/reporter';
import { cleanupCreatedPrograms } from './cleanup-programs';

class ProgramCleanupReporter implements Reporter {
  async onEnd(_result: FullResult): Promise<void> {
    await cleanupCreatedPrograms();
  }
}

export default ProgramCleanupReporter;
