const { src, dest } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.{png,svg,node.json}').pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
