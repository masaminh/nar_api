module.exports = {
  test: (val: unknown) => typeof val === 'string',
  serialize: (val: string) =>
    `"${val.replace(/([A-Fa-f0-9]{64}.zip)/, 'HASH-REPLACED.zip')}"`,
};
