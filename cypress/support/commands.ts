// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.

// ***********************************************


declare namespace Cypress {
  interface Chainable<Subject = any> {
    pushResetButton(): typeof pushResetButton;
    pushPlayButton(): typeof pushPlayButton;
    pushMicStepButton(): typeof pushMicStepButton;
    pushMacStepButton(): typeof pushMacStepButton;
    getDemoCode1(): typeof getDemoCode1;
    getDemoCode2(): typeof getDemoCode2;
    getDemoCode3(): typeof getDemoCode3;
    emptyEditors(): typeof emptyEditors;
  }
}


function pushResetButton(): void{
  cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(4)')
    .click();
}

function pushPlayButton(): void{
  cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(2)')
    .click();
}

function pushMicStepButton(): void{
  cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(1)')
    .click();
}

function pushMacStepButton(): void{
  cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > div > app-tool-bar-mic-view > section > button:nth-child(3)')
    .click();
}

function getDemoCode1(): void {
  cy.get('body > app-root > app-tool-bar > mat-toolbar > button:nth-child(8)')
    .click();
    cy.get('#mat-dialog-0 > app-getting-started-dialog > mat-dialog-content > ul > li:nth-child(13) > mat-dialog-actions > button:nth-child(1)')
    .click();
}

function getDemoCode2(): void {
  cy.get('body > app-root > app-tool-bar > mat-toolbar > button:nth-child(8)')
    .click();
  cy.get('#mat-dialog-0 > app-getting-started-dialog > mat-dialog-content > ul > li:nth-child(13) > mat-dialog-actions > button:nth-child(2)')
    .click();
}

function getDemoCode3(): void {
  cy.get('body > app-root > app-tool-bar > mat-toolbar > button:nth-child(8)')
    .click();
  cy.get('#mat-dialog-0 > app-getting-started-dialog > mat-dialog-content > ul > li:nth-child(13) > mat-dialog-actions > button:nth-child(3)')
    .click();
}

function emptyEditors(): void {
  cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(3) > div > div > app-editor > div')
    .type('{selectall}{selectall}{selectall}{backspace}');
  cy.get('body > app-root > app-grid-view > mat-grid-list > div > mat-grid-tile:nth-child(2) > div > div > app-micro-editor > div')
    .type('{selectall}{selectall}{selectall}{backspace}');
}


// NOTE: You can use it like so:
Cypress.Commands.add('pushResetButton', pushResetButton);
Cypress.Commands.add('emptyEditors', emptyEditors);
Cypress.Commands.add('pushPlayButton', pushPlayButton);
Cypress.Commands.add('pushMicStepButton', pushMicStepButton);
Cypress.Commands.add('pushMacStepButton', pushMacStepButton);
Cypress.Commands.add('getDemoCode1', getDemoCode1);
Cypress.Commands.add('getDemoCode2', getDemoCode2);
Cypress.Commands.add('getDemoCode3', getDemoCode3);



//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
