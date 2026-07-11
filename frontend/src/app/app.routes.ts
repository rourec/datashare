import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Accueil } from './pages/accueil/accueil';
import { History } from './pages/history/history';
import { Upload } from './pages/upload/upload';
import { UploadSuccess } from './pages/upload-success/upload-success';
import { Download } from './pages/download/download';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'accueil',
    component: Accueil
  },
  {
    path: 'mon-espace',
    component: History
  },
  {
    path: 'upload',
    component: Upload
  },
  {
    path: 'upload-success',
    component: UploadSuccess
  },
  {
    path: 'download/:token',
    component: Download
  }
];
