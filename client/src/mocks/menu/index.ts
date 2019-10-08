export let mock_menu = { files: async function files(params) {
 await this.go("uploaded");
 }, upload: async function upload(params) {
 await this.go("home");
 } };
