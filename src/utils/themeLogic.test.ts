import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTheme,
  getInitialTheme,
  VALID_THEMES,
  THEME_CONFIGS,
  AppTheme,
} from './themeLogic';

test('VALID_THEMES contains the 3 required themes', () => {
  assert.equal(VALID_THEMES.length, 3);
  assert.ok(VALID_THEMES.includes('soothing-sage'));
  assert.ok(VALID_THEMES.includes('evening-stone'));
  assert.ok(VALID_THEMES.includes('matcha-oat'));
});

test('isValidTheme correctly identifies valid and invalid theme names', () => {
  assert.equal(isValidTheme('soothing-sage'), true);
  assert.equal(isValidTheme('evening-stone'), true);
  assert.equal(isValidTheme('matcha-oat'), true);
  assert.equal(isValidTheme('dark-navy'), false);
  assert.equal(isValidTheme(''), false);
  assert.equal(isValidTheme(null), false);
  assert.equal(isValidTheme(undefined), false);
  assert.equal(isValidTheme(123), false);
});

test('THEME_CONFIGS contains valid color specs for all 3 themes', () => {
  for (const themeId of VALID_THEMES) {
    const config = THEME_CONFIGS[themeId];
    assert.ok(config, `Config must exist for ${themeId}`);
    assert.equal(config.id, themeId);
    assert.match(config.bgHex, /^#[0-9A-Fa-f]{6}$/);
    assert.match(config.accentHex, /^#[0-9A-Fa-f]{6}$/);
    assert.match(config.borderHex, /^#[0-9A-Fa-f]{6}$/);
    assert.ok(config.name.length > 0);
  }
});

test('getInitialTheme falls back cleanly when no environment is set', () => {
  const fallback: AppTheme = 'soothing-sage';
  const theme = getInitialTheme(fallback);
  assert.equal(theme, 'soothing-sage');
});
