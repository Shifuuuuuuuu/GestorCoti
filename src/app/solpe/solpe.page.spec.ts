import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolpePage } from './solpe.page';

describe('SolpePage', () => {
  let component: SolpePage;
  let fixture: ComponentFixture<SolpePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SolpePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
