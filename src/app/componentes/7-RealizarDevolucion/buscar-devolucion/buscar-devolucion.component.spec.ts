import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarDevolucionComponent } from './buscar-devolucion.component';

describe('BuscarDevolucionComponent', () => {
  let component: BuscarDevolucionComponent;
  let fixture: ComponentFixture<BuscarDevolucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscarDevolucionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BuscarDevolucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
