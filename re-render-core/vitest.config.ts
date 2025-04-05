import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom', // Or "jsdom" for frontend tests
        watch: false,
        fileParallelism: false,
        hookTimeout: 0,
        isolate: false,
        passWithNoTests: true,
        poolOptions: {
            threads: {
                // Tests may have side effects, e.g. writing files to disk,
                singleThread: true,
            },
        },
        coverage: {
            provider: 'istanbul', // Make sure we're using Istanbul
            reporter: ['text', 'json', 'html'], // Coverage reports
            include: ['src/**/*.ts'], // Include source files
            exclude: ['tests/**/*', 'node_modules'], // Exclude test files
            all: true, // Include all files for coverage, even if not directly tested
            clean: true, // Clean previous reports
            skipFull: false, // Don't skip fully covered files
            extension: ['.ts'], // Include TypeScript files
            enabled: true, // Enable coverage
            reportsDirectory: 'reports/coverage',
        },
    },
});
