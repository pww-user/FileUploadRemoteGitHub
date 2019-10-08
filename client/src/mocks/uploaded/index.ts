export let mock_uploaded = { back: async function back(params) {
 await this.go("home");
 },
 'folders[].download' : async function download(params){
 await this.go("landing");
 }
};
