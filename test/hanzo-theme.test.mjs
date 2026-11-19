import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relPath) {
	const raw = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
	return JSON.parse(raw);
}

test('product.json configures Hanzo Dark / Hanzo Light, IAM hanzo.id, X-Org-Id, and Zen 6 / qwen3+', () => {
	const product = readJson('product.json');
	assert.equal(product.nameLong, 'Hanzo IDE');
	assert.equal(product.darwinBundleIdentifier, 'ai.hanzo.code');
	assert.equal(product.configurationDefaults['workbench.colorTheme'], 'Hanzo Dark');
	assert.equal(product.configurationDefaults['workbench.preferredDarkColorTheme'], 'Hanzo Dark');
	assert.equal(product.configurationDefaults['workbench.preferredLightColorTheme'], 'Hanzo Light');
	assert.equal(product.hanzo.iamIssuer, 'https://hanzo.id');
	assert.equal(product.hanzo.orgHeader, 'X-Org-Id');
	assert.equal(product.hanzo.defaultModel, 'zen6-coder');
	assert.deepEqual(product.hanzo.models, [
		'zen6',
		'zen6-coder',
		'zen6-flash',
		'zen6-max',
		'zen6-free',
		'zen-vl',
	]);
	for (const model of [...product.hanzo.models, ...product.hanzo.recommendedLocalModels]) {
		assert.ok(!model.toLowerCase().includes('qwen2'), `forbidden qwen2 model found: ${model}`);
		assert.ok(!/(?:^|\/)zen[1-5](?:\b|-|$)/i.test(model), `legacy zen1..5 model found: ${model}`);
	}
});

test('theme-defaults registers Hanzo Dark and Hanzo Light with valid NLS labels', () => {
	const pkg = readJson('extensions/theme-defaults/package.json');
	const nls = readJson('extensions/theme-defaults/package.nls.json');
	const ids = pkg.contributes.themes.map((t) => t.id);
	assert.ok(ids.includes('Hanzo Dark'));
	assert.ok(ids.includes('Hanzo Light'));
	assert.equal(nls.hanzoDarkThemeLabel, 'Hanzo Dark');
	assert.equal(nls.hanzoLightThemeLabel, 'Hanzo Light');

	for (const theme of pkg.contributes.themes) {
		const themeFile = path.join(rootDir, 'extensions/theme-defaults', theme.path);
		assert.ok(fs.existsSync(themeFile), `missing theme file: ${theme.path}`);
	}
});

test('Hanzo Dark & Hanzo Light color theme JSONs match canonical Hanzo Unified Shell tokens', () => {
	const dark = readJson('extensions/theme-defaults/themes/hanzo_dark.json');
	assert.equal(dark.name, 'Hanzo Dark');
	assert.equal(dark.colors['activityBar.background'].toLowerCase(), '#09090b');
	assert.equal(dark.colors['sideBar.background'].toLowerCase(), '#0c0c0f');
	assert.equal(dark.colors['editor.background'].toLowerCase(), '#111114');
	assert.equal(dark.colors['titleBar.activeBackground'].toLowerCase(), '#09090b');
	assert.equal(dark.colors['statusBar.background'].toLowerCase(), '#09090b');
	assert.equal(dark.colors['panel.background'].toLowerCase(), '#111114');
	assert.equal(dark.colors['sideBar.border'].toLowerCase(), '#222226');
	assert.equal(dark.colors['panel.border'].toLowerCase(), '#222226');
	assert.equal(dark.colors['foreground'].toLowerCase(), '#fafafa');
	assert.equal(dark.colors['descriptionForeground'].toLowerCase(), '#a1a1aa');
	assert.equal(dark.colors['editorLineNumber.foreground'].toLowerCase(), '#71717a');
	assert.equal(dark.colors['testing.iconPassed'].toLowerCase(), '#10b981');
	assert.equal(dark.colors['editorWarning.foreground'].toLowerCase(), '#f59e0b');
	assert.equal(dark.colors['errorForeground'].toLowerCase(), '#ef4444');

	const darkStr = JSON.stringify(dark.colors).toLowerCase();
	assert.ok(!darkStr.includes('#0078d4'), 'must not contain VS Code blue #0078d4');
	assert.ok(!darkStr.includes('#007acc'), 'must not contain legacy VS Code blue #007acc');
	assert.ok(!darkStr.includes('#68217a'), 'must not contain VS Code purple #68217a');

	const light = readJson('extensions/theme-defaults/themes/hanzo_light.json');
	assert.equal(light.name, 'Hanzo Light');
	assert.equal(light.colors['activityBar.background'].toLowerCase(), '#f8f8fa');
	assert.equal(light.colors['sideBar.background'].toLowerCase(), '#f4f4f6');
	assert.equal(light.colors['editor.background'].toLowerCase(), '#ffffff');
	assert.equal(light.colors['titleBar.activeBackground'].toLowerCase(), '#f8f8fa');
	assert.equal(light.colors['statusBar.background'].toLowerCase(), '#f8f8fa');
	assert.equal(light.colors['panel.background'].toLowerCase(), '#ffffff');
	assert.equal(light.colors['sideBar.border'].toLowerCase(), '#e4e4e7');
	assert.equal(light.colors['foreground'].toLowerCase(), '#18181b');

	// Verify dark_modern and light_modern also parse as strict JSON
	const darkModern = readJson('extensions/theme-defaults/themes/dark_modern.json');
	const lightModern = readJson('extensions/theme-defaults/themes/light_modern.json');
	assert.equal(darkModern.include, './hanzo_dark.json');
	assert.equal(lightModern.include, './hanzo_light.json');
});

test('workbenchThemeService and modelCapabilities enforce Hanzo Dark and zero qwen2 references', () => {
	const themeSvc = fs.readFileSync(
		path.join(rootDir, 'src/vs/workbench/services/themes/common/workbenchThemeService.ts'),
		'utf8',
	);
	assert.ok(themeSvc.includes("COLOR_THEME_DARK = 'Hanzo Dark'"));
	assert.ok(themeSvc.includes("COLOR_THEME_LIGHT = 'Hanzo Light'"));
	assert.ok(!themeSvc.toLowerCase().includes('#007acc'));
	assert.ok(!themeSvc.toLowerCase().includes('#68217a'));

	const modelCaps = fs.readFileSync(
		path.join(rootDir, 'src/vs/workbench/contrib/code/common/modelCapabilities.ts'),
		'utf8',
	);
	assert.ok(modelCaps.includes("'zen6':"));
	assert.ok(modelCaps.includes("'zen6-coder':"));
	assert.ok(modelCaps.includes("'zen6-flash':"));
	assert.ok(modelCaps.includes("'zen6-max':"));
	assert.ok(modelCaps.includes("'zen-vl':"));
	assert.ok(modelCaps.includes("'qwen3-coder:8b'"));
	assert.ok(!modelCaps.toLowerCase().includes('qwen2'));
	assert.ok(!modelCaps.toLowerCase().includes('qwen-2'));
	assert.ok(!modelCaps.toLowerCase().includes('qwen 2'));
	assert.ok(!/zen[1-5]/i.test(modelCaps));
});
