// Copies node assets (icons, codex metadata) from nodes/ into dist/nodes/ —
// replaces gulpfile.js to eliminate the gulp 4 vulnerability subtree.

import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const SRC = 'nodes';
const DST = 'dist/nodes';
const MATCH = /\.(svg|png|node\.json)$/i;

function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(path);
			continue;
		}
		if (!MATCH.test(path)) continue;
		const dstPath = join(DST, relative(SRC, path));
		mkdirSync(dirname(dstPath), { recursive: true });
		copyFileSync(path, dstPath);
	}
}

walk(SRC);
