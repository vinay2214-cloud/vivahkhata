import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/domain/**', 'src/hooks/useRole.ts', 'server/**'],
      exclude: ['src/lib/firebase.ts', 'src/lib/geminiParser.ts', 'server/index.ts', 'server/prompts.ts'],
      reporter: ['text-summary', 'text'],
    },
  },
});
