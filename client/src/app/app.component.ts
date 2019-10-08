import { Component, Inject } from '@angular/core';
import { Screens } from './app.screens';
import * as mocks from 'mocks/index';
import { Hooks } from './app.hooks';
import { Bootstrap, TBootstrap } from 'smartux-client';

@Component({
  templateUrl: 'app.html'
})
export class ClientApp {

  constructor(@Inject(Bootstrap) bootstrap: TBootstrap, hooks: Hooks) {
    bootstrap(hooks, Screens.mapping, mocks);
  }

}

