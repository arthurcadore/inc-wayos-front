import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { Login } from '@/pages/auth/login';
import { ViewGlobal } from '@/pages/view-global/view-global';
import { SchoolDetails } from '@/pages/school-details/school-details';
import { Schools } from '@/pages/schools/schools';
import { authGuard } from '@/pages/auth/auth.guard';
import { OfflineDevices } from '@/pages/offline-devices/offline-devices';
import { ConnectedDevices } from '@/pages/connected-devices/connected-devices';
import { ChangelogPage } from '@/pages/changelog/changelog';

export const appRoutes: Routes = [

    { path: 'login', component: Login },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: ViewGlobal },
            { path: 'schools', component: Schools },
            { path: 'school-details', component: SchoolDetails },
            { path: 'offline-devices', component: OfflineDevices },
            { path: 'connected-devices', component: ConnectedDevices },
            { path: 'changelog', component: ChangelogPage },
        ],
    },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
