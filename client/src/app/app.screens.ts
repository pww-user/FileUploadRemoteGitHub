/***  Generated file, do not change.  */
import { MenuComponent } from './menu/menu';
import { home_PhonePortrait } from '../pages/home/PhonePortrait/home';
import { uploadcomplete_PhonePortrait } from '../pages/uploadcomplete/PhonePortrait/uploadcomplete';
import { uploaded_PhonePortrait } from '../pages/uploaded/PhonePortrait/uploaded';
import { fileopen_PhonePortrait } from '../pages/fileopen/PhonePortrait/fileopen';
import { landing_PhonePortrait } from '../pages/landing/PhonePortrait/landing';
import { login_PhonePortrait } from '../pages/login/PhonePortrait/login';
export class Screens {
  static declarations = [
    MenuComponent,
    home_PhonePortrait,
    uploadcomplete_PhonePortrait,
    uploaded_PhonePortrait,
    fileopen_PhonePortrait,
    landing_PhonePortrait,
    login_PhonePortrait
  ];
  static mapping = {
    'home': {
      PhonePortrait: home_PhonePortrait
    },
    'uploadcomplete': {
      PhonePortrait: uploadcomplete_PhonePortrait
    },
    'uploaded': {
      PhonePortrait: uploaded_PhonePortrait
    },
    'fileopen': {
      PhonePortrait: fileopen_PhonePortrait
    },
    'landing': {
      PhonePortrait: landing_PhonePortrait
    },
    'login': {
      PhonePortrait: login_PhonePortrait
    }
  }
}