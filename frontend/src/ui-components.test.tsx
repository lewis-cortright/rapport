import { render, screen } from '@testing-library/react';
import { Button, Card, Field, TextArea, TextInput, AppShell, SectionHeading } from '@rapport/ui';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('shared ui components', () => {
  it('renders button variants and sizes', () => {
    const { rerender } = render(
      <Button variant="primary" size="sm">
        Save
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    rerender(
      <>
        <Button variant="secondary" size="md" fullWidth>
          Cancel
        </Button>
        <Button variant="ghost" size="lg">
          Ghost
        </Button>
      </>
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ghost' })).toBeInTheDocument();
  });

  it('renders cards for both tone branches', () => {
    const { rerender } = render(<Card>Default card</Card>);
    expect(screen.getByText('Default card')).toBeInTheDocument();

    rerender(
      <Card tone="elevated" padded={false}>
        Elevated card
      </Card>
    );

    expect(screen.getByText('Elevated card')).toBeInTheDocument();
  });

  it('renders field helpers, text input, and textarea', () => {
    render(
      <>
        <Field label="Name" htmlFor="name" hint="Helpful hint">
          <TextInput id="name" defaultValue="rapport" />
        </Field>
        <Field label="Message" htmlFor="message">
          <TextArea id="message" defaultValue="hello" />
        </Field>
      </>
    );

    expect(screen.getByRole('textbox', { name: 'Name Helpful hint' })).toHaveValue('rapport');
    expect(screen.getByText('Helpful hint')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('hello');
  });

  it('renders the app shell with and without a header', () => {
    const { rerender } = render(
      <AppShell sidebar={<div>Sidebar</div>} header={<div>Header</div>}>
        <div>Main content</div>
      </AppShell>
    );

    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();

    rerender(
      <AppShell sidebar={<div>Sidebar only</div>}>
        <div>Main only</div>
      </AppShell>
    );

    expect(screen.getByText('Sidebar only')).toBeInTheDocument();
    expect(screen.queryByText('Header')).not.toBeInTheDocument();
    expect(screen.getByText('Main only')).toBeInTheDocument();
  });

  it('supports a collapsible mobile navigation pattern', async () => {
    const user = userEvent.setup();

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      media: '(max-width: 768px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    render(
      <AppShell sidebar={<div>Mobile sidebar</div>} mobileNavigationLabel="navigation">
        <div>Mobile content</div>
      </AppShell>
    );

    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    const sidebar = screen.getByText('Mobile sidebar').closest('aside');

    expect(sidebar).toHaveAttribute('hidden');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(screen.getByText('Mobile sidebar')).toBeInTheDocument();
    const closeToggle = screen.getByRole('button', { name: 'Close navigation' });

    expect(sidebar).not.toHaveAttribute('hidden');
    expect(closeToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Dismiss navigation overlay' })).toBeInTheDocument();

    await user.click(closeToggle);

    expect(sidebar).toHaveAttribute('hidden');
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders section headings with and without optional copy', () => {
    const { rerender } = render(<SectionHeading eyebrow="Eyebrow" title="Title" description="Description" />);

    expect(screen.getByText('Eyebrow')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();

    rerender(<SectionHeading title="Plain title" />);

    expect(screen.getByRole('heading', { name: 'Plain title' })).toBeInTheDocument();
    expect(screen.queryByText('Eyebrow')).not.toBeInTheDocument();
  });
});

