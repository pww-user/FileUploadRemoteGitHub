exports.fileopen = async (session, models, vars) => {
    models.fileopen = vars.page;
    await session.screen('fileopen');
};