import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

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
    path: 'iniciar-sesion',
    loadChildren: () => import('./iniciar-sesion/iniciar-sesion.module').then( m => m.IniciarSesionPageModule)
  },
  {
    path: 'registrar-usuario',
    loadChildren: () => import('./registrar-usuario/registrar-usuario.module').then( m => m.RegistrarUsuarioPageModule)
  },
  {
    path: 'perfil-usuario',
    loadChildren: () => import('./perfil-usuario/perfil-usuario.module').then( m => m.PerfilUsuarioPageModule),     canActivate: [AuthGuard]
  },
  {
    path: 'menu-cotizador',
    loadChildren: () => import('./menu-cotizador/menu-cotizador.module').then( m => m.MenuCotizadorPageModule),     canActivate: [AuthGuard]
  },
  {
    path: 'solpe',
    loadChildren: () => import('./solpe/solpe.module').then( m => m.SolpePageModule),     canActivate: [AuthGuard]
  },
  {
    path: 'historial-solpe',
    loadChildren: () => import('./historial-solpe/historial-solpe.module').then( m => m.HistorialSolpePageModule),     canActivate: [AuthGuard]
  },
  {
    path: 'menu-solpe',
    loadChildren: () => import('./menu-solpe/menu-solpe.module').then( m => m.MenuSolpePageModule),     canActivate: [AuthGuard]
  },
  {
    path: 'gestorsolpes',
    loadChildren: () => import('./gestorsolpes/gestorsolpes.module').then( m => m.GestorsolpesPageModule),     canActivate: [AuthGuard]
  },
  {
    path: 'visualizacion-solped',
    loadChildren: () => import('./visualizacion-solped/visualizacion-solped.module').then( m => m.VisualizacionSolpedPageModule),     canActivate: [AuthGuard]
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
