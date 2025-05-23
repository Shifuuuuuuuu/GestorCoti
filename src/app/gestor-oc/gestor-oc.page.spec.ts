import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestorOcPage } from './gestor-oc.page';

describe('GestorOcPage', () => {
  let component: GestorOcPage;
  let fixture: ComponentFixture<GestorOcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestorOcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
