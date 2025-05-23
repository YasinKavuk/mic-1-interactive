describe('complete workflow test without animation', () => {
  beforeEach(() => {
    cy.visit('/')
  });

  it('Test the navigation to the default page', () => {
    cy.url().should('include', '/')
  });

  it('Tests whether the About Dialog is opening', ()=> {
    cy.get('body > app-root > app-tool-bar > mat-toolbar > button:nth-child(6)')
      .click(); 
    cy.get('#mat-dialog-0 > app-about-dialog > h1').should('include.text', 'About');
  });

  it('Tests whether the "Getting Started" Dialog is opening', ()=> {
    cy.get('body > app-root > app-tool-bar > mat-toolbar > button:nth-child(5)')
      .click();
    cy.get('#mat-dialog-0 > app-getting-started-dialog > h2').should('include.text', 'Getting Started');
  });

  it('Tests whether the navigation to the "Forum" is working', ()=> {
    cy.get('body > app-root > app-tool-bar > mat-toolbar > a')
      .should('be.visible')
      .then(($a) => {
        expect($a).to.have.attr('href','https://github.com/vs-ude/mic-1-interactive/discussions/120')
      })
  });

  it('Load demo code from "Getting Started" Dialog', ()=> {
    cy.get('body > app-root > app-tool-bar > mat-toolbar > button:nth-child(5)')
      .click();
    cy.get('#mat-dialog-0 > app-getting-started-dialog > mat-dialog-content > ul > li:nth-child(16) > mat-dialog-actions > button:nth-child(1)')
      .click();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div')
      .should('contain.text', '.method add(p1, p2)');
  });

  it('tests whether the macro- and micro-code is persistant when the site is reloaded. Also tests if the editors are editable', () => {
    cy.emptyEditors();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(2) > div > div > app-micro-editor > ngx-dropzone > div')
      .type('testMicro7457034950', {delay: 1})
      .should('include.text', 'testMicro7457034950');
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div')
      .type('testMacro9349856039', {delay: 1})
      .should('include.text', 'testMacro9349856039');
    cy.visit('/');
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(2) > div > div > app-micro-editor > ngx-dropzone > div')
      .should('include.text', 'testMicro7457034950');
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div')
      .should('include.text', 'testMacro9349856039');
  });

  it('Tests whether the animate checkbox is persistant', () =>{
    cy.get('#mat-checkbox-1-input').uncheck({force: true});
    cy.visit('/');
    cy.get('#mat-checkbox-1-input').should('not.be.checked')
    cy.get('#mat-checkbox-1-input').check({force: true});
    cy.visit('/');
    cy.get('#mat-checkbox-1-input').should('be.checked')
  })

  it('Tests whether the animatespeed slider is persistant', () =>{
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > div > div > mat-slider')
      .type("{home}") // moves slider to the leftmost position which should set the value to 1
    cy.visit('/');
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > div > div > div > label.speed-label')
      .should('have.text', '1')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > div > div > mat-slider')
      .type("{end}")
    cy.visit('/');
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > div > div > div > label.speed-label')
      .should('have.text', '15')
  })

  it('Do the function button disable and enable like intended. It should only diable when the play button is pressed and animation is on. should enable again when reset/load is pressed', ()=>{
    cy.getDemoCode1();
    cy.get('#mat-checkbox-1-input').check({force: true});

    // test after microstep button. buttons should not be disabled
    cy.pushResetButton();
    cy.pushMicStepButton();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(2)')
      .should('not.be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(3)')
      .should('not.be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(1)')
      .should('not.be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(4)')
      .should('not.be.disabled')

    // test after run button. buttons should be disabled besides reset/load button
    cy.pushPlayButton();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(2)')
      .should('be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(3)')
      .should('be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(1)')
      .should('be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(4)')
      .should('not.be.disabled')

    // test after reset/load button. buttons should not be disabled
    cy.pushResetButton();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(2)')
      .should('not.be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(3)')
      .should('not.be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(1)')
      .should('not.be.disabled')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(4)')
      .should('not.be.disabled')
  })

  it('tests the console', ()=>{
    cy.getDemoCode1();

    // test console after loading new code
    cy.pushResetButton();
    cy.get('#mat-tab-label-0-1').click();
    cy.get('#mat-tab-content-0-1 > div > app-debug-console > div > p').should('include.text', 'Macrocode loaded successfully!')

    // test console after inserting an error to the macrocode and loading
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div')
      .type('!', {delay: 1})
    cy.pushResetButton();
    cy.get('#mat-tab-label-0-1').click();
    cy.get('#mat-tab-content-0-1 > div > app-debug-console > div > p').should('include.text', 'floatingElementError')

    // test console after inserting an error to the microcode and loading
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div')
      .type('{backspace}', {delay: 1})
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(2) > div > div > app-micro-editor > ngx-dropzone > div')
      .type('{upArrow}{upArrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}{rightarrow}!', {delay: 1})
    cy.pushResetButton();
    cy.get('#mat-tab-content-0-1 > div > app-debug-console > div > p').should('include.text', 'Unexpected token')
  })

  it('Tests wether the error highlighting works', ()=>{
    cy.getDemoCode1();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div')
      .type('{upArrow}{upArrow}!', {delay: 1})
    cy.pushResetButton();

    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div > div.ace_gutter > div > div.ace_gutter-cell.ace_gutter-active-line.ace_error')
      .should('have.text', "10");
  })

  it('Tests whether the memory view does show the right values after loading the code', () => {
    cy.getDemoCode1();
    cy.pushResetButton();

    // navigates to the memory view
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(4) > div > div > mat-tab-group > mat-tab-header > button.mat-ripple.mat-tab-header-pagination.mat-tab-header-pagination-after.mat-elevation-z4')
      .click().click();
    cy.get('#mat-tab-label-0-2 > div > span').click();
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(1) > button')
      .click();

    // tests whether the values are right on every second entry in the memory view
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(2) > div > span.address')
      .should('have.text', '(0x00)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(2) > div > span.value')
      .should('have.text', '182')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(4) > div > span.address')
      .should('have.text', '(0x02)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(4) > div > span.value')
      .should('have.text', '1')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(6) > div > span.address')
      .should('have.text', '(0x04)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(6) > div > span.value')
      .should('have.text', '1')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(8) > div > span.address')
      .should('have.text', '(0x06)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(8) > div > span.value')
      .should('have.text', '0')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(10) > div > span.address')
      .should('have.text', '(0x08)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(10) > div > span.value')
      .should('have.text', '7')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(12) > div > span.address')
      .should('have.text', '(0x0A)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(12) > div > span.value')
      .should('have.text', '8')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(14) > div > span.address')
      .should('have.text', '(0x0C)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(14) > div > span.value')
      .should('have.text', '0')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(16) > div > span.address')
      .should('have.text', '(0x0E)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(16) > div > span.value')
      .should('have.text', '255')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(18) > div > span.address')
      .should('have.text', '(0x10)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(18) > div > span.value')
      .should('have.text', '3')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(20) > div > span.address')
      .should('have.text', '(0x12)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(20) > div > span.value')
      .should('have.text', '0')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(22) > div > span.address')
      .should('have.text', '(0x14)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(22) > div > span.value')
      .should('have.text', '1')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(24) > div > span.address')
      .should('have.text', '(0x16)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(24) > div > span.value')
      .should('have.text', '2')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(26) > div > span.address')
      .should('have.text', '(0x18)')
    cy.get('#mat-tab-content-0-2 > div > app-memory-view > div > mat-tree > mat-tree-node:nth-child(26) > div > span.value')
      .should('have.text', '204')
  });

  it('tests switiching of the editors when the toggle-switch is pressed', () => {
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(2) > div > div > p')
      .should('have.text', 'Microprograms')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > p')
      .should('have.text', 'Macroassembler')
    cy.get('body > app-root > app-tool-bar > mat-toolbar > button.mat-focus-indicator.mat-menu-trigger.mat-icon-button.mat-button-base')
      .click(); // clicks on 3 dot menu button
    cy.get('#mat-slide-toggle-2').click();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(2) > div > div > p')
      .should('have.text', 'Macroassembler')
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > p')
      .should('have.text', 'Microprograms')
  });

  it('tests presentation mode', () => {
    cy.getDemoCode1();
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div > div.ace_scroller > div')
      .should('has.css', 'font-size', '14px')
    cy.get('body > app-root > app-tool-bar > mat-toolbar > button.mat-focus-indicator.mat-menu-trigger.mat-icon-button.mat-button-base')
      .click(); // clicks on 3 dot menu button
    cy.get('#mat-slide-toggle-3').click()
    cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > ngx-dropzone > div > div.ace_scroller > div')
      .should('has.css', 'font-size', '26px')
    cy.get('#MBR > foreignObject > div').should('have.css', 'font-size', '18px')
  });

  it('Test demo code 1, the result has to be 15', () => {
    cy.getDemoCode1();
    cy.pushResetButton();
    cy.get('#mat-checkbox-1-input').uncheck({force: true});
    cy.pushPlayButton();
    cy.get('#mat-tab-content-0-0 > div > div > app-stack > div > div:nth-child(5) > div.stack-value.ng-tns-c112-2')
      .should('have.text', ' 15 ');
  });

  it('Test demo code 2(uses custom microprograms), the result has to be 15 ', () => {
    cy.getDemoCode2();
    cy.pushResetButton();
    cy.get('#mat-checkbox-1-input').uncheck({force: true});
    cy.pushPlayButton();
    cy.get('#mat-tab-content-0-0 > div > div > app-stack > div > div:nth-child(5) > div.stack-value.ng-tns-c112-2')
      .should('have.text', ' 15 ');
  });

  it('Test demo code 3(uses jumps), the 8 and 9 in the stack need to switch position for the result to be right', () => {
    cy.getDemoCode3();
    cy.pushResetButton();
    cy.get('#mat-checkbox-1-input').uncheck({force: true});
    cy.pushPlayButton();
    cy.get('#mat-tab-content-0-0 > div > div > app-stack > div > div:nth-child(10) > div.stack-value.ng-tns-c112-2')
      .should('have.text', ' 9 ');
    cy.get('#mat-tab-content-0-0 > div > div > app-stack > div > div:nth-child(11) > div.stack-value.ng-tns-c112-2')
      .should('have.text', ' 8 ');
  });

})