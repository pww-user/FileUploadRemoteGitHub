import { GlobalData } from "./globaldata.service";
import { BaseScreen, DI } from "smartux-client";
export class Screen extends BaseScreen {
    protected global: GlobalData = DI.get<GlobalData>(GlobalData);
}
