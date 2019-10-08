import { Component } from '@angular/core';
import { Screen } from 'app/screen';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var window: any;

@Component({
  selector: 'screen-fileopen-phoneportrait',
  templateUrl: 'fileopen.html'
})
export class fileopen_PhonePortrait extends Screen {
    data: any;
    constructor(private sanitizer: DomSanitizer) {
        super();
     }
  ngOnInit(): void {
    super.ngOnInit();
    // Logic to run when the screen loads goes here.
  }

  sanitize(url): SafeResourceUrl {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    // Logic to run when the screen unloads goes here.
  }

  onDataLoad(data: any): void {
    // Logic to run when the screen's data is updated goes here.
  }
}
