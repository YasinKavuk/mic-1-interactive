import { Injectable } from '@angular/core';
import { RegProviderService } from './reg-provider.service';
import { StackProviderService } from './stack-provider.service';
import { TestSettings } from '../Presenter/controller.service';

@Injectable({
  providedIn: 'root'
})
export class BatchTestService {

  private testSettings: TestSettings;

  constructor(
    private regProvider: RegProviderService,
    private stackProvider: StackProviderService,
  ) { }


  test(testSettings: TestSettings) {
    console.log(testSettings)
    this.testSettings = testSettings;
    if (testSettings.testTos) {
      this.testTos()
    }

    if (testSettings.testStack) {
      this.testStack()
    }

  }


  private testTos() {

    const tosValue = this.regProvider.getRegister("TOS").getValue();
    if (tosValue !== this.testSettings.tosValue) {
      console.error(`TOS value did not match - TOS-Value: ${tosValue}, Test-Value: ${this.testSettings.tosValue}`);
      throw new Error(`TOS value did not match - TOS-Value: ${tosValue}, Test-Value: ${this.testSettings.tosValue}`);
    }

  }

  testStack() {
    throw new Error('Method not implemented.');
  }


}
