import { TestBed } from '@angular/core/testing';

import { VistaCotizacionesService } from './vista-cotizaciones.service';

describe('VistaCotizacionesService', () => {
  let service: VistaCotizacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VistaCotizacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
