import fs from 'fs';
import path from 'path';

export const TRACKER_PATH = path.join(
  process.cwd(),
  '.test-artifacts',
  'created-program-ids.jsonl',
);

export function initTracker(): void {
  fs.mkdirSync(path.dirname(TRACKER_PATH), { recursive: true });
  fs.writeFileSync(TRACKER_PATH, '');
}

export function trackProgramId(id: string): void {
  fs.appendFileSync(TRACKER_PATH, `${id}\n`);
}

export function getTrackedProgramIds(): string[] {
  if (!fs.existsSync(TRACKER_PATH)) {
    return [];
  }

  const content = fs.readFileSync(TRACKER_PATH, 'utf8').trim();
  if (!content) {
    return [];
  }

  return [...new Set(content.split('\n').filter(Boolean))];
}
