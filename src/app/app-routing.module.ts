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
    path: 'solpe',
    loadChildren: () => import('./solpe/solpe.module').then( m => m.SolpePageModule),     canActivate: [AuthGuard]
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
    path: 'editar-solped',
    loadChildren: () => import('./editar-solped/editar-solped.module').then( m => m.EditarSolpedPageModule)
  },
  {
    path: 'editar-solpeds',
    loadChildren: () => import('./editar-solpeds/editar-solpeds.module').then( m => m.EditarSolpedsPageModule)
  },
  {
    path: 'generador-oc',
    loadChildren: () => import('./generador-oc/generador-oc.module').then( m => m.GeneradorOcPageModule)
  },
  {
    path: 'menu-oc',
    loadChildren: () => import('./menu-oc/menu-oc.module').then( m => m.MenuOcPageModule)
  },
  {
    path: 'validar-oc',
    loadChildren: () => import('./validar-oc/validar-oc.module').then( m => m.ValidarOcPageModule)
  },
  {
    path: 'gestor-oc',
    loadChildren: () => import('./gestor-oc/gestor-oc.module').then( m => m.GestorOcPageModule)
  },
  {
    path: 'historial-oc',
    loadChildren: () => import('./historial-oc/historial-oc.module').then( m => m.HistorialOcPageModule)
  },
  {
    path: 'menu-admin',
    loadChildren: () => import('./menu-admin/menu-admin.module').then( m => m.MenuAdminPageModule)
  },
  {
    path: 'administrar-solped',
    loadChildren: () => import('./administrar-solped/administrar-solped.module').then( m => m.AdministrarSolpedPageModule)
  },
  {
    path: 'administrar-cotizaciones',
    loadChildren: () => import('./administrar-cotizaciones/administrar-cotizaciones.module').then( m => m.AdministrarCotizacionesPageModule)
  },
  {
    path: 'menu-ordenes',
    loadChildren: () => import('./menu-ordenes/menu-ordenes.module').then( m => m.MenuOrdenesPageModule)
  },
  {
    path: 'generador-ordenes',
    loadChildren: () => import('./generador-ordenes/generador-ordenes.module').then( m => m.GeneradorOrdenesPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
