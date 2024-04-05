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

  private testStack() {

    let valuesOnStack = this.stackProvider.items.map(x => x[1]);

    for (let i = this.testSettings.stackPositions.length - 1; i >= 0; i--) {
      const realStackValue = valuesOnStack.pop();
      if (this.testSettings.stackPositions[i] !== realStackValue) {
        throw new Error(`Stack value did not match - Stack-Value: ${realStackValue}, Test-Value: ${this.testSettings.stackPositions[i]}`)
      }
    }

  }


}
