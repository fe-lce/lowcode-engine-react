vi.mock('lodash', async (importOriginal) => {
  const original = await importOriginal();

  return {
    ...original,
    debounce:
      (fn) =>
      (...args: any[]) =>
        fn.apply(this, args),
    throttle:
      (fn) =>
      (...args: any[]) =>
        fn.apply(this, args),
  };
});

export const mockConsoleWarn = vi.fn();
console.warn = mockConsoleWarn;

process.env.NODE_ENV = 'production';
