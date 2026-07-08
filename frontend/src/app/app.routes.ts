import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { History } from './pages/history/history';
import { Upload } from './pages/upload/upload';
import { Download } from './pages/download/download';
import { Accueil } from './pages/accueil/accueil';

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
    path: 'accueil',
    component: Accueil
  },
  {
    path: 'register',
    component: Register
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
    path: 'download/:token',
    component: Download
  }
];
