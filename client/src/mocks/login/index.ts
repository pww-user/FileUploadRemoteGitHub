export let mock_login = {
 login: async function login(params) {
 await this.go("home");
 }
};
