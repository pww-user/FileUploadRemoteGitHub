import { Component } from '@angular/core';
import { Screen } from 'app/screen';
import { HttpClient, HttpHeaders } from '@angular/common/http';

declare var window: any;

@Component({
    selector: 'screen-home-phoneportrait',
    templateUrl: 'home.html'
})
export class home_PhonePortrait extends Screen {
    data: any;
    isPhoto: boolean;

    constructor(private http: HttpClient) {
        super();
    }

    ngOnInit(): void {
        super.ngOnInit();
        // Logic to run when the screen loads goes here.
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        // Logic to run when the screen unloads goes here.
    }

    onDataLoad(data: any): void {
        // Logic to run when the screen's data is updated goes here.
    }

    onTypeChange(isPhoto) {
        this.data.file = '';
    }
}
