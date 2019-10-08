'use strict';
module.exports = {
    startURL: 'https://encodable.com/uploaddemo/',
    eventDetection: {
        // The minimum interval for checking events.
        debounceTime: 500,
        debug: false,
        domMutations: {
            watch: true,
            ignoreList: []
        }
    },
    // ******* User Agent *******
    // Suffix to add to the user agent string.
    userAgentSuffix: 'Powwow/1.0',
    // userAgentReplacement: "Custom user agent string goes here",
    //
    // Viewport configuration
    autoResize: true,
    viewportSize: {
        width: 1024,
        height: 768
    },
    // List of URLs to enable authentication for.
    authWhitelistUrls: ''
};