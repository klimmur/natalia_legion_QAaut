import { cleanupCreatedPrograms } from './cleanup-programs';

export default async function globalTeardown(): Promise<void> {
  await cleanupCreatedPrograms();
}
