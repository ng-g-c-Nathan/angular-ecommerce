import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarCarritoComprasComponent } from './gestionar-carrito-compras.component';

describe('GestionarCarritoComprasComponent', () => {
  let component: GestionarCarritoComprasComponent;
  let fixture: ComponentFixture<GestionarCarritoComprasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarCarritoComprasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionarCarritoComprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
