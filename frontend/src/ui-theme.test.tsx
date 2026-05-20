import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createThemeVariables, primitiveTokens, semanticThemes, semanticTokens, themeVariables, tokenVar, useTheme } from '@rapport/ui';
import { beforeEach, describe, expect, it } from 'vitest';

function ThemeConsumer() {
  const theme = useTheme();

  return (
    <button onClick={theme.toggleMode}>
      Active theme: {theme.mode}
    </button>
  );
}

function BrokenThemeConsumer() {
  useTheme();
  return null;
}

describe('semantic theme system', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('exposes primitive and semantic token values', () => {
    expect(primitiveTokens.colors.primaryEmerald[500]).toBe('#66CC00');
    expect(primitiveTokens.colors.brandGreen).toBe('#66CC00');
    expect(primitiveTokens.typography.fontFamilyPrimary).toContain('Poppins');
    expect(semanticTokens.colors.actionPrimary).toBe('#66CC00');
    expect(semanticTokens.colors.textOnPrimary).toBe('#fff');
    expect(themeVariables['--primary-emerald-500']).toBe('#66CC00');
    expect(themeVariables['--colors-text-on-primary']).toBe('#fff');
  });

  it('creates theme variables and allows overrides', () => {
    const variables = createThemeVariables('light', {
      '--colors-action-primary': '#123456'
    });

    expect(variables['--colors-action-primary']).toBe('#123456');
    expect(variables['--colors-border']).toBe('#E5E7EB');
    expect(variables['--typography-font-size-base']).toBe('1rem');
  });

  it('creates a dark-theme variable set', () => {
    const darkVariables = createThemeVariables('dark');

    expect(darkVariables['--colors-background-base']).toBe(semanticThemes.dark.colors.backgroundBase);
    expect(darkVariables['--colors-text-base']).toBe(semanticThemes.dark.colors.textBase);
    expect(darkVariables['--effects-shell-gradient']).toBe(semanticThemes.dark.effects.shellGradient);
  });

  it('builds CSS variable references with and without fallbacks', () => {
    expect(tokenVar('--colors-action-primary')).toBe('var(--colors-action-primary)');
    expect(tokenVar('--colors-action-primary', '#66CC00')).toBe('var(--colors-action-primary, #66CC00)');
  });

  it('provides semantic variables to the rendered subtree', () => {
    render(
      <ThemeProvider overrides={{ '--colors-action-primary': '#123456' }}>
        <div data-testid="theme-child">Theme child</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    const styleElement = document.getElementById('rapport-theme-variables');

    expect(screen.getByTestId('theme-child')).toBeInTheDocument();
    expect(root).toHaveAttribute('data-ui-theme', 'rapport');
    expect(root).toHaveAttribute('data-ui-mode', 'light');
    expect(root.style.getPropertyValue('--primary-emerald-500')).toBe('');
    expect(styleElement).not.toBeNull();
    expect(styleElement?.textContent).toContain("html[data-ui-theme='rapport'] {");
    expect(styleElement?.textContent).toContain("html[data-ui-theme='rapport'][data-ui-mode='dark'] {");
    expect(styleElement?.textContent).toContain('--colors-action-primary: #123456;');
    expect(styleElement?.textContent).toContain('--colors-text-on-primary: #fff;');
    expect(styleElement?.textContent).toContain('--primary-emerald-500: #66CC00;');
  });

  it('supports switching between light and dark mode through the theme hook', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider initialMode="light">
        <ThemeConsumer />
      </ThemeProvider>
    );

    const toggle = screen.getByRole('button', { name: 'Active theme: light' });
    const root = document.documentElement;

    expect(root).toHaveAttribute('data-ui-mode', 'light');
    expect(window.localStorage.getItem('rapport.theme.mode')).toBe('light');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Active theme: dark' })).toBeInTheDocument();
    expect(root).toHaveAttribute('data-ui-mode', 'dark');
    expect(window.localStorage.getItem('rapport.theme.mode')).toBe('dark');
  });

  it('hydrates the initial theme mode from localStorage', () => {
    window.localStorage.setItem('rapport.theme.mode', 'dark');

    render(
      <ThemeProvider initialMode="light">
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: 'Active theme: dark' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-ui-mode', 'dark');
  });

  it('throws when the theme hook is used outside the provider', () => {
    expect(() => render(<BrokenThemeConsumer />)).toThrow('useTheme must be used within ThemeProvider');
  });
});

