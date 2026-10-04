import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifiedPdfResponse } from '../lib/verified-pdf';
import { correctImportedProject, correctedDevelopers, unavailableBrochureSlugs } from '../lib/catalogue-corrections';

test('rejects HTML errors even when labelled PDF', async () => {
  for (const type of ['text/html', 'application/pdf']) {
    assert.equal(await verifiedPdfResponse(new Response('<html>Error</html>', { headers: { 'content-type': type } })), null);
  }
  assert.equal(await verifiedPdfResponse(new Response('%PDF-1.7', {status: 502, headers: {'content-type': 'application/pdf'}})), null);
});
test('retains PDF bytes when signature crosses stream chunks', async () => {
  const chunks = ['%P', 'DF-', '1.7\ncontents'];
  const input = new ReadableStream<Uint8Array>({pull(c) {const next = chunks.shift(); if (next) c.enqueue(new TextEncoder().encode(next)); else c.close();}});
  const output = await verifiedPdfResponse(new Response(input, {headers: {'content-type':'application/octet-stream'}}));
  assert.ok(output);
  assert.equal(await new Response(output).text(), '%PDF-1.7\ncontents');
});
test('keeps unconfirmed identities explicit and withholds known invalid brochures', () => {
  for (const [slug, name] of Object.entries(correctedDevelopers)) {
    assert.equal(correctImportedProject({slug, developer:'Al', brochure:'valid.pdf'}).developer, name);
  }
  for (const slug of unavailableBrochureSlugs) {
    assert.equal(correctImportedProject({slug, developer:'Aldar', brochure:'error.pdf'}).brochure, '');
  }
  const untouched = {slug:'another-project',developer:'Aldar',brochure:'valid.pdf'};
  assert.deepEqual(correctImportedProject(untouched), untouched);
});

test('corrected names resolve to directory profiles; unknown names do not', async () => {
  const { getProjectRecord, getProjectRegistry } = await import('../lib/imported-projects');
  const { developerSlugFor, getDeveloperProfile } = await import('../lib/taxonomy');
  for (const [slug, expected] of Object.entries(correctedDevelopers)) {
    const project = getProjectRecord(slug);
    assert.ok(project, slug);
    assert.equal(project.developer, expected);
    const profile = getDeveloperProfile(developerSlugFor(expected));
    if (expected === 'Developer to confirm') assert.equal(profile, null);
    else assert.ok(profile, expected);
  }
  assert.equal(developerSlugFor('Imtiaz Developments'), 'imtiaz');
  assert.ok(!getProjectRegistry().developers.includes('Developer to confirm'));
  for (const slug of unavailableBrochureSlugs) assert.equal(getProjectRecord(slug)?.brochure, '');
});
