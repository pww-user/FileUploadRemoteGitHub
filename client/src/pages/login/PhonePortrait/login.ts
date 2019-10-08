import { Component } from '@angular/core';
import { Screen } from 'app/screen';

@Component({
  selector: 'screen-login-phoneportrait',
  templateUrl: 'login.html'
})
export class login_PhonePortrait extends Screen {
  data: any;

  ngOnInit(): void {
    super.ngOnInit();
    // Logic to run when the screen loads goes here.
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    // Logic to run when the screen unloads goes here.
  }

  onDataLoad(data: any) {
    // Logic to run when the screen's data is updated goes here.
      this.action('login', null, null);
  }
}
