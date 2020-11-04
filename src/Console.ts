export class Console {
  consoleContainer;
  constructor() {
    this.consoleContainer = document.querySelector('#console-container');;
  }
  
  showConsole() {
    this.consoleContainer.style.display = 'block';
  }
  
  hideConsole() {
    this.consoleContainer.style.display = 'none';
  }
}