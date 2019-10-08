exports['files[].download'] = async (session, models, vars) => {
    await session.transform.studio2506.update('uploaded', models.uploaded);
    await session.transform.studio2506.action('uploaded', `files[${ vars.item.$i }].download`);
};
exports.upload = async (session, models, vars) => {
    await session.transform.studio2506.update('uploaded', models.uploaded);
    await session.transform.studio2506.action('uploaded', 'upload');
};
exports['folders[].openFolder'] = async (session, models, vars) => {
    await session.transform.studio2506.update('uploaded', models.uploaded);
    await session.transform.studio2506.action('uploaded', `folders[${ vars.item.$i }].openFolder`);
};
exports.back = async (session, models, vars) => {
    session.transform.studio2506.page().back(1);
};