import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from './helpers';

describe('Custom Exercises — US1: Create a Custom Exercise', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('C1: creates a custom exercise and shows it in the manager list', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));

    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'Cable Face Pull');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));

    await waitFor(() => {
      expect(screen.getByText('Cable Face Pull')).toBeInTheDocument();
    });
  });

  it('C2: shows validation error for empty name submission', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.click(screen.getByRole('button', { name: /add exercise/i }));

    expect(await screen.findByText('Enter an exercise name.')).toBeInTheDocument();
  });

  it('C3: shows validation error for whitespace-only name', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), '   ');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));

    expect(await screen.findByText('Enter an exercise name.')).toBeInTheDocument();
  });

  it('C4: shows duplicate error when name matches a predefined exercise', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'Bench press');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));

    expect(await screen.findByText('An exercise with this name already exists.')).toBeInTheDocument();
  });

  it('C5: shows duplicate error for case-insensitive match with existing custom exercise', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));

    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'MyMove');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('MyMove');

    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'mymove');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));

    expect(await screen.findByText('An exercise with this name already exists.')).toBeInTheDocument();
  });
});

describe('Custom Exercises — US3: Rename a Custom Exercise', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('C7: renames an exercise and shows the new name in the list', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'Face Pull');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('Face Pull');

    await user.click(screen.getByRole('button', { name: /rename face pull/i }));

    const renameInput = screen.getByRole('textbox', { name: /new name/i });
    await user.clear(renameInput);
    await user.type(renameInput, 'Cable Face Pull');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Cable Face Pull')).toBeInTheDocument();
      expect(screen.queryByText('Face Pull')).not.toBeInTheDocument();
    });
  });

  it('C8: shows error when renaming to an existing predefined exercise name', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'MyLift');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('MyLift');

    await user.click(screen.getByRole('button', { name: /rename mylift/i }));

    const renameInput = screen.getByRole('textbox', { name: /new name/i });
    await user.clear(renameInput);
    await user.type(renameInput, 'Bench press');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText('An exercise with this name already exists.')).toBeInTheDocument();
  });
});

describe('Custom Exercises — US4: Retire a Custom Exercise', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('C9: retiring an exercise moves it to the retired state and removes it from active picker', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'FaceRow');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('FaceRow');

    await user.click(screen.getByRole('button', { name: /retire facerow/i }));

    await waitFor(() => {
      expect(screen.getByText(/\[retired\]/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create workout/i }));

    const picker = await screen.findByRole('combobox', { name: /exercise/i }) as HTMLSelectElement;
    const optionTexts = Array.from(picker.options).map((o) => o.text);
    expect(optionTexts.some((t) => t.includes('FaceRow') && !t.includes('[retired]'))).toBe(false);
  });

  it('C10: editing a routine with a retired custom exercise shows it as disabled [retired] option', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'FaceRow');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('FaceRow');

    await user.click(screen.getByRole('button', { name: /create workout/i }));
    const picker = await screen.findByRole('combobox', { name: /exercise/i }) as HTMLSelectElement;
    await user.selectOptions(picker, Array.from(picker.options).find((o) => o.text.includes('FaceRow'))!.value);
    await user.type(screen.getByPlaceholderText(/e\.g\. push day/i), 'Core day');
    await user.click(screen.getByRole('button', { name: /save workout/i }));
    await screen.findByText('Core day');

    // showExerciseEditor is still true — retire directly without toggling
    await user.click(screen.getByRole('button', { name: /retire facerow/i }));
    await screen.findByText(/\[retired\]/i);

    // Close the exercise editor so the workout card Edit button is unambiguous
    await user.click(screen.getByRole('button', { name: /manage exercises/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      const editPicker = screen.getByRole('combobox', { name: /exercise/i }) as HTMLSelectElement;
      const retiredOption = Array.from(editPicker.options).find((o) => o.text.includes('FaceRow') && o.text.includes('[retired]'));
      expect(retiredOption).toBeDefined();
      expect(retiredOption?.disabled).toBe(true);
    });
  });

  it('C11: reactivating a retired exercise restores it to the active list and picker', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'FaceRow');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('FaceRow');

    await user.click(screen.getByRole('button', { name: /retire facerow/i }));
    await screen.findByText(/\[retired\]/i);

    await user.click(screen.getByRole('button', { name: /reactivate facerow/i }));

    await waitFor(() => {
      expect(screen.queryByText(/\[retired\]/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create workout/i }));
    const picker = await screen.findByRole('combobox', { name: /exercise/i }) as HTMLSelectElement;
    const optionTexts = Array.from(picker.options).map((o) => o.text);
    expect(optionTexts.some((t) => t.includes('FaceRow · custom'))).toBe(true);
  });
});

describe('Custom Exercises — US5: View and Distinguish Custom vs Predefined', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('C12: predefined exercises have no Rename/Retire buttons; custom exercise shows both; picker labels custom with · custom', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'CableFaceRow');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('CableFaceRow');

    expect(screen.queryByRole('button', { name: /rename bench press/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retire bench press/i })).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /rename cablefacerow/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retire cablefacerow/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /create workout/i }));
    const picker = await screen.findByRole('combobox', { name: /exercise/i }) as HTMLSelectElement;
    const optionTexts = Array.from(picker.options).map((o) => o.text);
    expect(optionTexts.some((t) => t.includes('CableFaceRow · custom'))).toBe(true);
  });
});

describe('Custom Exercises — US2: Select in Routine', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('C6: custom exercise appears in workout picker with · custom label', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await user.click(await screen.findByRole('button', { name: /manage exercises/i }));
    await user.type(screen.getByRole('textbox', { name: /exercise name/i }), 'Cable Face Pull');
    await user.click(screen.getByRole('button', { name: /add exercise/i }));
    await screen.findByText('Cable Face Pull');

    await user.click(screen.getByRole('button', { name: /create workout/i }));

    const picker = await screen.findByRole('combobox', { name: /exercise/i }) as HTMLSelectElement;
    const optionTexts = Array.from(picker.options).map((o) => o.text);
    expect(optionTexts).toContain('Cable Face Pull · custom');
  });
});
