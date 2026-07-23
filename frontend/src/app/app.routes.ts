import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Accueil } from './pages/accueil/accueil';
import { History } from './pages/history/history';
import { Upload } from './pages/upload/upload';
import { UploadSuccess } from './pages/upload-success/upload-success';
import { Download } from './pages/download/download';
import { authGuard } from './core/guards/auth.guard';

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
    component: History,
    canActivate: [authGuard]
  },
  {
    path: 'upload',
    component: Upload,
    canActivate: [authGuard]
  },
  {
    path: 'upload-success',
    component: UploadSuccess,
    canActivate: [authGuard]
  },
  {
    path: 'download/:token',
    component: Download
  }
];
