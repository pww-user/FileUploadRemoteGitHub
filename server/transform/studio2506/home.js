exports.home = async (session, models, vars) => {
    models.home = vars.page;
    await session.screen('home');
};