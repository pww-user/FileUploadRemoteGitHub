exports.files = async (session, models, vars) => {
    await session.transform.studio2506.url('https://encodable.com/uploaddemo/?action=listfiles');
};
exports.upload = async (session, models, vars) => {
    await session.transform.studio2506.url('https://encodable.com/uploaddemo/');
};