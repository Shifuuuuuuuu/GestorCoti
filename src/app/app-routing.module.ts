import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'iniciar-sesion',
    pathMatch: 'full'
  },
  {
    path: 'cotizaciones',
    loadChildren: () => import('./cotizaciones/cotizaciones.module').then( m => m.CotizacionesPageModule)
  },
  {
    path: 'iniciar-sesion',
    loadChildren: () => import('./iniciar-sesion/iniciar-sesion.module').then( m => m.IniciarSesionPageModule)
  },
  {
    path: 'registrar-usuario',
    loadChildren: () => import('./registrar-usuario/registrar-usuario.module').then( m => m.RegistrarUsuarioPageModule)
  },
  {
    path: 'perfil-usuario',
    loadChildren: () => import('./perfil-usuario/perfil-usuario.module').then( m => m.PerfilUsuarioPageModule)
  },
  {
    path: 'cotizacion-comparativa',
    loadChildren: () => import('./cotizacion-comparativa/cotizacion-comparativa.module').then( m => m.CotizacionComparativaPageModule)
  },
  {
    path: 'vista-cotizaciones',
    loadChildren: () => import('./vista-cotizaciones/vista-cotizaciones.module').then( m => m.VistaCotizacionesPageModule)
  },
  {
    path: 'comparaciones',
    loadChildren: () => import('./comparaciones/comparaciones.module').then( m => m.ComparacionesPageModule)
  },
  {
    path: 'cotiaziones-aprobadas',
    loadChildren: () => import('./cotiaziones-aprobadas/cotiaziones-aprobadas.module').then( m => m.CotiazionesAprobadasPageModule)
  },
  {
    path: 'menu-cotizador',
    loadChildren: () => import('./menu-cotizador/menu-cotizador.module').then( m => m.MenuCotizadorPageModule)
  },
  {
    path: 'chat',
    loadChildren: () => import('./chat/chat.module').then( m => m.ChatPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
