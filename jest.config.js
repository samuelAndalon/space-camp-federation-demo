module.exports = {
  bail: false,
  collectCoverage: false,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json'
    }
  },
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
    'node',
    'ts',
    'tsx',
  ],
  preset: 'ts-jest/presets/js-with-ts',
  testRegex: '/__tests__/.*(test|spec)\\.(jsx?|tsx?)$'
};
