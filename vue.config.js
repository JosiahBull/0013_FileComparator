module.exports = {
  lintOnSave: false,
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        extraResources: ['src/services-io/db/fileStore.db']
      }
    }
  }
};
