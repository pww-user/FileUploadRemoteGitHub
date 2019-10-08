import { Component } from '@angular/core';
import { Screen } from 'app/screen';

@Component({
  selector: 'menu-component',
  templateUrl: 'menu.html'
})
export class MenuComponent extends Screen {
    isHome() {
        return this.screenService.getCurrentId() === 'home';
    }
}
