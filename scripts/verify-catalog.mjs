import { pathToFileURL } from 'node:url';

export function validateCatalog(response) {
  if (!response?.success || !Array.isArray(response.data) || response.data.length === 0) {
    throw new Error('The published enrollment catalog is empty or unavailable.');
  }
  const slugs = new Set();
  for (const program of response.data) {
    if (!program.id || !program.slug || slugs.has(program.slug) || !(program.startingPrice > 0)) {
      throw new Error('The published catalog contains missing identifiers, duplicate slugs, or unavailable pricing.');
    }
    slugs.add(program.slug);
  }
  return response.data;
}

async function verify(origin) {
  const response = await fetch(`${origin}/api/v1/public/programs`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
  const programs = validateCatalog(await response.json());
  for (const program of programs) {
    const response = await fetch(`${origin}/api/v1/public/programs/${encodeURIComponent(program.slug)}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Program ${program.slug} cannot be loaded (${response.status}).`);
    const { data } = await response.json();
    if (!data?.plans?.some(plan => plan.isActive && plan.offerPrice > 0 && plan.reserveAmount > 0)) {
      throw new Error(`Program ${program.slug} has no active enrollment plan.`);
    }
  }
  console.log(`Verified ${programs.length} published programs and their enrollment plans.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verify(process.argv[2]).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
