/**
 * Jest Configuration
 * 
 * Sets the roots to include both the backend source (for module resolution)
 * and the tests directory (where test files live).
 */
module.exports = {
    // Tell Jest to look for tests in the tests/backend directory
    roots: [
        '<rootDir>',
        '<rootDir>/../../tests/backend',
    ],

    // Tell Jest where to find node_modules for test files outside src/backend
    modulePaths: [
        '<rootDir>/node_modules',
    ],

    // Match test files with .test.js extension
    testMatch: [
        '**/*.test.js',
    ],

    // Set test environment
    testEnvironment: 'node',

    // Timeout for each test (10 seconds)
    testTimeout: 10000,
};
