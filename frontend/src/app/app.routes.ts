import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { History } from './pages/history/history';

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
    path: 'history',
    component: History
  }
];
