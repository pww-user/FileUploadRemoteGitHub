declare module 'app/globaldata.service' {
	export class GlobalData {
	    /**
	     * Put any global data values you want to use across screens here, e.g.:
	     *
	     * myValue: string;
	     *
	     * Use "global.myValue" to refer to it in your screen template, or this.global.myValue in your controller.
	     */
	    value1: string;
	    value2: string;
	}

}
declare module 'app/screen' {
	import { GlobalData } from 'app/globaldata.service';
	import { BaseScreen } from 'smartux-client';
	export class Screen extends BaseScreen {
	    protected global: GlobalData;
	}

}
declare module 'app/menu/menu' {
	import { Screen } from 'app/screen';
	export class MenuComponent extends Screen {
	    isHome(): boolean;
	}

}
declare module 'app/app.screens' {
	/***  Generated file, do not change.  */
	import { MenuComponent } from 'app/menu/menu';
	import { home_PhonePortrait } from 'app/../pages/home/PhonePortrait/home';
	import { uploadcomplete_PhonePortrait } from 'app/../pages/uploadcomplete/PhonePortrait/uploadcomplete';
	import { uploaded_PhonePortrait } from 'app/../pages/uploaded/PhonePortrait/uploaded';
	import { fileopen_PhonePortrait } from 'app/../pages/fileopen/PhonePortrait/fileopen';
	import { landing_PhonePortrait } from 'app/../pages/landing/PhonePortrait/landing';
	import { login_PhonePortrait } from 'app/../pages/login/PhonePortrait/login';
	export class Screens {
	    static declarations: (typeof MenuComponent | typeof home_PhonePortrait | typeof uploadcomplete_PhonePortrait | typeof fileopen_PhonePortrait)[];
	    static mapping: {
	        'home': {
	            PhonePortrait: typeof home_PhonePortrait;
	        };
	        'uploadcomplete': {
	            PhonePortrait: typeof uploadcomplete_PhonePortrait;
	        };
	        'uploaded': {
	            PhonePortrait: typeof uploaded_PhonePortrait;
	        };
	        'fileopen': {
	            PhonePortrait: typeof fileopen_PhonePortrait;
	        };
	        'landing': {
	            PhonePortrait: typeof landing_PhonePortrait;
	        };
	        'login': {
	            PhonePortrait: typeof login_PhonePortrait;
	        };
	    };
	}

}
declare module 'app/app.hooks' {
	import { AppHooks } from 'smartux-client';
	export class Hooks extends AppHooks {
	    /**
	     * Initial parameters to send to the server.
	     */
	    getServerInitParams(): Promise<any>;
	    /**
	     * Initialize the UI with data from the server.
	     */
	    initializeUI(params: any): void;
	    /**
	     * Override what happens when going to a new screen.
	     */
	    overrideStateHandler(oldScreen: string, newScreen: string, data: any): string;
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
	    interceptCustomURLScheme(type: string, name: string, data: any): Promise<boolean>;
	    /**
	     * Override what happens when there is a push notification.
	     *
	     * data - JSON object containing Notification data
	     *
	     * Returns: true - Continue with normal flow, e.g. if type is event, send the event to the server.
	     *          false - Don't continue with the normal flow.
	     */
	    onPushNotification(data: any): Promise<boolean>;
	    /**
	     * Error when an internal Push Notification error occurs and the cache is aborted.
	     */
	    onPushNotificationError(e: Error): Promise<void>;
	    /**
	     * Override what happens when on a file download event
	     * params - information about the download
	     * url - the url to download the file
	     * Returns: true - Continue with normal flow, e.g. download and try to open with
	     *                   the default application/ social share plugin
	     *          false - Don't continue with the normal flow.
	     */
	    onDownloadFile(params: any, url: any): Promise<boolean>;
	    /**
	     * Override what happens when the back button is pressed (Android)
	     * Returns: true - continue with the normal flow, e.g. exit the application
	     *          false - Don't continue with the normal flow.
	     */
	    onBackButton(): boolean;
	    /**
	     * Override what happens when the application enters the background
	     * Returns: true - continue witht the normal flow, e.g disconnect after the time
	     *                  specified in config.ts
	     *          false - don't continue with the normal flow.
	    */
	    onPause(): boolean;
	    /**
	     * Override what happens when the application enters the foreground
	     * Returns: true - continue witht the normal flow, e.g reconnect if disconnected
	     *          false - don't continue with the normal flow.
	    */
	    onResume(): boolean;
	    /**
	     * Override what happens when a request comes in to switch applications
	     * Returns: true - continue with the normal flow, e.g prompt the user
	     *          false - don't prompt the user, ignore the request
	     */
	    onSwitchSessionRequest(): boolean;
	}

}
declare module 'app/app.component' {
	import { Hooks } from 'app/app.hooks';
	import { TBootstrap } from 'smartux-client';
	export class ClientApp {
	    constructor(bootstrap: TBootstrap, hooks: Hooks);
	}

}
declare module 'app/app.module' {
	export class AppModule {
	}

}
