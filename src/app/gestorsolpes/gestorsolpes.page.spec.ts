import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestorsolpesPage } from './gestorsolpes.page';

describe('GestorsolpesPage', () => {
  let component: GestorsolpesPage;
  let fixture: ComponentFixture<GestorsolpesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestorsolpesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
