import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function initializeJob(input) {
  const jobs = Array.isArray(input) ? input : input.value || [];
  return jobs.find(job => job.name?.split('/').at(-1) === 'initialize');
}

export function latestRun(job) {
  const run = job?.properties?.latest_run || job?.properties?.latestRun || job?.latest_run || job?.latestRun || {};
  // Some Azure CLI versions omit the run ID but retain its unique history URL.
  if (!run.id && run.url) return { ...run, id: new URL(run.url).pathname.split('/').at(-1) };
  return run;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const job = initializeJob(JSON.parse(readFileSync(0, 'utf8')));
  const run = latestRun(job);
  switch (process.argv[2]) {
    case 'exists': process.stdout.write(job ? 'true' : 'false'); break;
    case 'id': process.stdout.write(run.id || ''); break;
    case 'status': process.stdout.write(run.id && run.id !== process.argv[3] ? run.status || '' : ''); break;
    default: throw new Error('Use exists, id, or status');
  }
}
