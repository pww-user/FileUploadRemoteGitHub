import { NgModule } from "@angular/core";
import { IonicApp, IonicModule } from "ionic-angular";
import { SmartUxClient, config } from "smartux-client";
import { ComponentsModule } from "components";
import { Screens } from "./app.screens";
import { ClientApp } from "./app.component";
import { Hooks } from "./app.hooks";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { GlobalData } from "./globaldata.service";
@NgModule({
    bootstrap: [IonicApp],
    declarations: [ClientApp, ...Screens.declarations],
    entryComponents: Screens.declarations,
    imports: [
        IonicModule.forRoot(ClientApp, config.ionic),
        HttpClientModule,
        SmartUxClient,
        ComponentsModule
    ],
    providers: [
        Hooks,
        HttpClientModule,
        GlobalData
    ]
})
export class AppModule {
}
