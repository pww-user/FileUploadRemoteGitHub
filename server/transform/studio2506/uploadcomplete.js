exports.uploadcomplete = async (session, models, vars) => {
    models.uploadcomplete = vars.page;
    await session.screen('uploadcomplete');
};
exports.inprogress = async (session, models, vars) => {
    await session.showLoading('Uploading... (' + vars.page.progressPercent + ')');
};