import { writeFile, rename } from 'node:fs/promises';

const scholarUrl = 'https://scholar.google.com/citations?user=5VnMGoEAAAAJ&hl=en';
const papers = [
  { label: 'In-hand manipulation', title: 'Trajectory optimization for in-hand manipulation with tactile force control', id: 'u-x6o8ySG0sC' },
  { label: 'Cable manipulation', title: 'Sim-to-real transfer for cable manipulation with tactile sensing and homotopy-constrained path planning', id: 'u5HHmVD_uO8C' },
];
const repos = [
  { label: 'mjsim', repo: 'mjsim' },
  { label: 'BioTac simulation', repo: 'biotac_sim_plugin' },
  { label: 'Hand-E model fork', repo: 'mujoco_menagerie_hande' },
  { label: 'Thesis toolkit', repo: 'thesis-template' },
];
async function fetchSource(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'victor-staven-website' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}
function count(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid count for ${label}`);
  return value;
}
// Fetch only on explicit refresh; the site always builds from the saved snapshot.
const [scholar, stars] = await Promise.all([
  fetchSource(scholarUrl).then(response => response.text()),
  Promise.all(repos.map(async ({ label, repo }) => {
    const data = await (await fetchSource(`https://api.github.com/repos/vmstavens/${repo}`)).json();
    if (data.full_name !== `vmstavens/${repo}`) throw new Error(`Unexpected repository: ${repo}`);
    return { label, value: count(data.stargazers_count, repo), href: data.html_url };
  })),
]);
if (!scholar.includes('Victor Melbye Staven')) throw new Error('Scholar profile could not be verified');
const totalMatch = scholar.match(/<td class="gsc_rsb_std">([\d,]+)<\/td>/);
if (!totalMatch) throw new Error('Scholar citation total unavailable');
const total = count(Number(totalMatch[1].replaceAll(',', '')), 'total citations');
const rows = [...scholar.matchAll(/<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g)].map(match => match[1]);
const citations = papers.map(({ label, title, id }) => {
  const row = rows.find(row => row.includes(`5VnMGoEAAAAJ:${id}`));
  const match = row?.match(/class="gsc_a_ac[^\"]*">([\d,]*)<\/a>/);
  if (!match || !row.toLowerCase().includes(title.toLowerCase())) throw new Error(`Scholar paper unavailable: ${title}`);
  return {
    label, title, value: count(Number(match[1].replaceAll(',', '')), title),
    href: `https://scholar.google.com/citations?view_op=view_citation&user=5VnMGoEAAAAJ&citation_for_view=5VnMGoEAAAAJ:${id}`,
  };
});
if (citations.reduce((sum, row) => sum + row.value, 0) !== total) {
  throw new Error('Scholar profile changed: update the paper list before refreshing the snapshot');
}
const snapshot = {
  updated: new Date().toISOString().slice(0, 10),
  citations: { total, source: scholarUrl, rows: citations },
  stars: { total: stars.reduce((sum, row) => sum + row.value, 0), source: 'https://github.com/vmstavens?tab=repositories', rows: stars },
};
const target = new URL('../src/data/metrics.json', import.meta.url);
const temporary = new URL('../src/data/metrics.json.tmp', import.meta.url);
await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n');
await rename(temporary, target);
console.log(`Updated metrics for ${snapshot.updated}: ${total} citations, ${snapshot.stars.total} featured-project stars.`);
