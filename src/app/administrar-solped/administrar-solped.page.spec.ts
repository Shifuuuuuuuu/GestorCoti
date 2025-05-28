import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministrarSolpedPage } from './administrar-solped.page';

describe('AdministrarSolpedPage', () => {
  let component: AdministrarSolpedPage;
  let fixture: ComponentFixture<AdministrarSolpedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministrarSolpedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
