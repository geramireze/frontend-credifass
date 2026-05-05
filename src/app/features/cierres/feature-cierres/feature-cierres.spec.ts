import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureCierres } from './feature-cierres';

describe('FeatureCierres', () => {
  let component: FeatureCierres;
  let fixture: ComponentFixture<FeatureCierres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCierres],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureCierres);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
