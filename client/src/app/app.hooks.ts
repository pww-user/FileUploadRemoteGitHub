import { Injectable } from '@angular/core';
import { AppHooks } from 'smartux-client';

@Injectable()
export class Hooks extends AppHooks {

    /**
     * Initial parameters to send to the server.
     */
    async getServerInitParams(): Promise<any> {
        return {};
    }

    /**
     * Initialize the UI with data from the server.
     */
    initializeUI(params: any): void {
    }

    /**
     * Override what happens when going to a new screen.
     */
    overrideStateHandler(oldScreen: string, newScreen: string, data: any): string {
        return newScreen;
    }

    /**
     * Override what happens when a custom URL scheme is called.
     *
     * type - 'event' is currently the only supported type.
     * name - Name of event, e.g. 'login.submit'
     * data - JSON object containing URL data.
     *
     * Returns: true - Continue with normal flow, e.g. if type is event, send the event to the server.
     *          false - Don't continue with the normal flow.
     */
    async interceptCustomURLScheme(type: string, name: string, data: any): Promise<boolean> {
        return true;
    }

    /**
     * Override what happens when there is a push notification.
     *
     * data - JSON object containing Notification data
     *
     * Returns: true - Continue with normal flow, e.g. if type is event, send the event to the server.
     *          false - Don't continue with the normal flow.
     */
    async onPushNotification(data: any) {
        return true;
    }

    /**
     * Error when an internal Push Notification error occurs and the cache is aborted.
     */
    async onPushNotificationError(e: Error) {

    }

    /**
     * Override what happens when on a file download event
     * params - information about the download
     * url - the url to download the file
     * Returns: true - Continue with normal flow, e.g. download and try to open with
     *                   the default application/ social share plugin
     *          false - Don't continue with the normal flow.
     */
    async onDownloadFile(params, url){
        return true;
    }

    /**
     * Override what happens when the back button is pressed (Android)
     * Returns: true - continue with the normal flow, e.g. exit the application
     *          false - Don't continue with the normal flow.
     */
    onBackButton(){
        return true;
    }

    /**
     * Override what happens when the application enters the background
     * Returns: true - continue witht the normal flow, e.g disconnect after the time
     *                  specified in config.ts
     *          false - don't continue with the normal flow.
    */
    onPause(){
        return true;
    }

    /**
     * Override what happens when the application enters the foreground
     * Returns: true - continue witht the normal flow, e.g reconnect if disconnected
     *          false - don't continue with the normal flow.
    */
    onResume(){
        return true;
    }

    /**
     * Override what happens when a request comes in to switch applications
     * Returns: true - continue with the normal flow, e.g prompt the user
     *          false - don't prompt the user, ignore the request
     */
    onSwitchSessionRequest() {
        return true;
    }
}
