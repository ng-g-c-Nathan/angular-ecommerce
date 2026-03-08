import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarListaDeseosComponent } from './gestionar-lista-deseos.component';

describe('GestionarListaDeseosComponent', () => {
  let component: GestionarListaDeseosComponent;
  let fixture: ComponentFixture<GestionarListaDeseosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarListaDeseosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionarListaDeseosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
