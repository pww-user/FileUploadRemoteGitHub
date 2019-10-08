export let mock_uploaded = { back: function back(params) {
        this.go("home");
    },
    'folders[].download' : function download(params){
        this.go("landing");
    }
};
