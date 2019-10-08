export let mock_landing = {
 go: async function go(params) {
 this
 .go("fileopen");
 },
 back: async function back(params) {
 await this.go("uploaded");
 }
};
