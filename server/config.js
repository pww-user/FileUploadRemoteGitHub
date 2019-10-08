module.exports = {
    // Port to run on. Can be overriden with '--port' launch parameter.  Not used if launched with '--sessionID'.
    port: 3000,
    // Logging settings.
    logging: {
        logLevel: 'info',
        // If set to true, all developer run log files are stored in a logs folder.
        persist: false,
        // Things to not log.  Applies to client requests/responses (<== and ==>)
        filters: {},
        // Things to not log.  Applies to API requests/responses (<-- and -->)
        apiFilters: {},
        logEntrySize: {
            client: {
                request: -1,
                response: 80
            },
            api: {
                request: 80,
                response: 0
            }
        }
    },
    // WebSocket Server settings.
    websocket: {
        // # of seconds to send keep-alive pings.
        keepAlive: 30,
        // The maximum allowed message size in bytes.
        maxPayload: 66000,
        // Enable/disable permessage-deflate compression of websocket frames.
        perMessageDeflate: true
    },
    // Settings for the appServer
    appServer: {
        port: 9080,
        protocol: 'http',
        host: 'localhost',
        rejectUnauthorized: false
    },
    // Configure how long the session lives without client connections.
    connectionWaitTimes: {
        // # of seconds that a disconnected session stays.
        disconnected: 5 * 60,
        // # of seconds to wait for the first initial connection.  If not set, defaults to 'disconnected' time.
        firstconnect: 300 * 60
    },
    // How long a file download token is valid for once it's first accessed. (Default is 10 minutes)
    fileDownloadTokenValidTime: 10 * 60 * 1000,
    chrome: {
        // Configuration for various Chrome allowed proxy settings.
        // See: https://www.chromium.org/developers/design-documents/network-settings/#TOC-Command-line-options-for-proxy-settings
        proxy: {
            // If true, uses "--proxy-auto-detect" (https://en.wikipedia.org/wiki/Web_Proxy_Auto-Discovery_Protocol)
            autoDetect: false,
            // If enabled, used Proxy Auto Config script to determine proxy server: https://en.wikipedia.org/wiki/Proxy_auto-config
            autoConfigScript: {
                enabled: false,
                // Uses --proxy-pac-url=<url>
                url: ''
            },
            // If enabled, uses the manual proxy server setting.
            proxyServer: {
                enabled: false,
                // Uses --proxy-server=<url>
                url: '',
                // If specified, adds in --proxy-bypass-list=<bypassRules>
                // See https://cs.chromium.org/chromium/src/net/proxy_resolution/proxy_bypass_rules.h?sq=package:chromium&type=cs&l=96-139
                bypassRules: ''
            }
        },
        // See: https://www.chromium.org/developers/design-documents/http-authentication
        authServerWhiteList: ''
    }
};