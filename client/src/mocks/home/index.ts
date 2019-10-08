export let mock_home = {
    beginUpload: function beginUpload(params) {
        this.go("uploadcomplete");
    }
};
