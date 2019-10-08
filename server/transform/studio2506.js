exports.filedownload = async (session, models, vars) => {
    session.openFile(vars.download);
};

exports.dialog_alert = async (session, models, vars) => {
    await session.alert(vars.dialog.message);
    session.transform.studio2506.acceptDialog();
};

exports.dialog_confirm = async (session, models, vars) => {
    let isConfirmed = await session.confirm(vars.dialog.message);
    if (isConfirmed) {
        session.transform.studio2506.acceptDialog();
    } else {
        session.transform.studio2506.dismissDialog();
    }
};

exports.dialog_prompt = async (session, models, vars) => {
    let prompt = await session.prompt(vars.dialog.message, { value: vars.dialog.defaultPrompt});
    if(prompt != null) {
        session.transform.studio2506.acceptDialog(prompt);
    } else {
        session.transform.studio2506.dismissDialog();
    }
};

exports.dialog_beforeunload = async (session, models, vars) => {
    let isConfirmed = await session.confirm(vars.dialog.message, { okLabel: 'Leave' });
    if (isConfirmed) {
        session.transform.studio2506.acceptDialog();
    } else {
        session.transform.studio2506.dismissDialog();
    }
};
