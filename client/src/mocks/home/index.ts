export let mock_home = {
 beginUpload: async function beginUpload(params) {
 await this.go("uploadcomplete");
 }
};
