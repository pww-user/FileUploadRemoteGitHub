exports.landing = async (session, models, vars) => {
    models.landing = vars.page;
    await session.screen('landing');
};
exports.landing2 = async (session, models, vars) => {
    models.landing = vars.page;
    await session.screen('landing');
};