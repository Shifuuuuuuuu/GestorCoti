import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneradorOcPage } from './generador-oc.page';

describe('GeneradorOcPage', () => {
  let component: GeneradorOcPage;
  let fixture: ComponentFixture<GeneradorOcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneradorOcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
