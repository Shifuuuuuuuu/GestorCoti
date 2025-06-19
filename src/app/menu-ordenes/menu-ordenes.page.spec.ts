import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuOrdenesPage } from './menu-ordenes.page';

describe('MenuOrdenesPage', () => {
  let component: MenuOrdenesPage;
  let fixture: ComponentFixture<MenuOrdenesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuOrdenesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
