exports.uploaded = async (session, models, vars) => {
    models.uploaded = vars.page;
    await session.screen('uploaded');
};