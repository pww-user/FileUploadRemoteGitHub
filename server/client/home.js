exports.beginUpload = async (session, models, vars) => {
    await session.transform.studio2506.update('home', models.home);
    await session.transform.studio2506.action('home', 'beginUpload');
};
exports.viewUploaded = async (session, models, vars) => {
    await session.transform.studio2506.update('home', models.home);
    await session.transform.studio2506.action('home', 'viewUploaded');
};