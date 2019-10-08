export let mock_landing = {
    go: function go(params) {
        this
            .go("fileopen");
    },
    back: function back(params) {
        this.go("uploaded");
    }
};
