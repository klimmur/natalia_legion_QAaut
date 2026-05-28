import { deleteProgramsByIds } from './delete-program';
import { getTrackedProgramIds, initTracker } from './program-tracker';

export async function cleanupCreatedPrograms(): Promise<void> {
  const programIds = getTrackedProgramIds();
  if (programIds.length === 0) {
    return;
  }

  console.log(`Cleaning up ${programIds.length} test program(s)...`);

  const results = await deleteProgramsByIds(programIds);

  for (const result of results) {
    if (!result.ok) {
      console.warn(
        `Failed to delete program ${result.id}: ${result.status} ${result.message}`,
      );
      continue;
    }

    console.log(`Deleted program ${result.id}`);
  }

  initTracker();
}
