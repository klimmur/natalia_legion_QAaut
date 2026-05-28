import dotenv from 'dotenv';
import path from 'node:path';
import {
  deleteProgramsByIds,
  getAllPrograms,
} from '../../../../support/delete-program';
import { initTracker } from '../../../../support/program-tracker';

dotenv.config({ path: path.join(process.cwd(), '.env') });

type CliOptions = {
  all: boolean;
  ids: string[];
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    all: false,
    ids: [],
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--all') {
      options.all = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--id') {
      const id = argv[i + 1];
      if (!id) {
        throw new Error('Missing value for --id');
      }
      options.ids.push(id);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.all && options.ids.length === 0) {
    options.all = true;
  }

  return options;
}

function printUsage(): void {
  console.log(`Usage:
  npx tsx .agents/skills/didaxis-program-deleter/scripts/delete-programs.ts [options]

Options:
  --all              Fetch all program UUIDs via GET /api/programs, then delete each one
  --id <uuid>        Delete a specific program UUID (repeatable)
  --dry-run          Print targets without calling DELETE

Examples:
  npx tsx .agents/skills/didaxis-program-deleter/scripts/delete-programs.ts
  npx tsx .agents/skills/didaxis-program-deleter/scripts/delete-programs.ts --all --dry-run
  npx tsx .agents/skills/didaxis-program-deleter/scripts/delete-programs.ts --id 3eb19aa5-6901-42ce-b510-0a8abcba513f`);
}

function printResults(results: Awaited<ReturnType<typeof deleteProgramsByIds>>): void {
  const deleted = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);

  console.log(`Deleted: ${deleted.length}`);
  for (const result of deleted) {
    console.log(`- ${result.id}`);
  }

  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}`);
    for (const result of failed) {
      console.warn(`- ${result.id}: ${result.status} ${result.message}`);
    }
  }
}

async function main(): Promise<void> {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    return;
  }

  const options = parseArgs(process.argv.slice(2));

  if (options.all) {
    const programs = await getAllPrograms();

    if (programs.length === 0) {
      console.log('No programs found via GET /api/programs.');
      return;
    }

    console.log(`Target program(s): ${programs.length}`);
    for (const program of programs) {
      console.log(`- ${program.id} (${program.name})`);
    }

    if (options.dryRun) {
      console.log('Dry run only. No programs were deleted.');
      return;
    }

    const results = await deleteProgramsByIds(programs.map((program) => program.id));
    printResults(results);
    initTracker();
    return;
  }

  if (options.ids.length === 0) {
    console.log('No program UUIDs to delete.');
    return;
  }

  console.log(`Target program(s): ${options.ids.length}`);
  for (const id of options.ids) {
    console.log(`- ${id}`);
  }

  if (options.dryRun) {
    console.log('Dry run only. No programs were deleted.');
    return;
  }

  const results = await deleteProgramsByIds(options.ids);
  printResults(results);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  printUsage();
  process.exitCode = 1;
});
