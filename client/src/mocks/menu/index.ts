export let mock_menu = { files: function files(params) {
        this.go("uploaded");
    }, upload: function upload(params) {
        this.go("home");
    } };
