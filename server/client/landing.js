exports.go = async (session, models, vars) => {
    await session.transform.studio2506.action('landing', 'go');
};
exports.back = async (session, models, vars) => {
    session.transform.studio2506.page().back(1);
};