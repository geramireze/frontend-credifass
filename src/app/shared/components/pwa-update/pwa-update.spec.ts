import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaUpdate } from './pwa-update';

describe('PwaUpdate', () => {
  let component: PwaUpdate;
  let fixture: ComponentFixture<PwaUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
