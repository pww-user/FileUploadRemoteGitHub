exports.back = async (session, models, vars) => {
    await session.transform.studio2506.update('uploadcomplete', models.uploadcomplete);
    await session.transform.studio2506.action('uploadcomplete', 'back');
};
exports.uploadedLink = async (session, models, vars) => {
    await session.transform.studio2506.update('uploadcomplete', models.uploadcomplete);
    await session.transform.studio2506.action('uploadcomplete', 'uploadedLink');
};