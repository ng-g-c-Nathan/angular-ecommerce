import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostrarCatalogoProductosComponent } from './mostrar-catalogo-productos.component';

describe('MostrarCatalogoProductosComponent', () => {
  let component: MostrarCatalogoProductosComponent;
  let fixture: ComponentFixture<MostrarCatalogoProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostrarCatalogoProductosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MostrarCatalogoProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
