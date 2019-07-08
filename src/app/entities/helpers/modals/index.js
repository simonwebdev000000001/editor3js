class Modal {
  constructor() {
    let parent = document.querySelector('.viewer.webgl-view'),
      parentContainer = this.parentContainer = parent.querySelector('.modals-container');
    if (!parentContainer) {
      parentContainer = document.createElement('div');
      parentContainer.className = 'modals-container';
      parent.appendChild(parentContainer);
    }


    parentContainer.addEventListener('click', (e) => {
      if (e.target.className == parentContainer.className || e.target.className == container.className) this.onClose();
    });

    let container = this.container = document.createElement('div');
    container.className = 'uni-modals';
    parentContainer.appendChild(container);
    let modalContainer = this.content = document.createElement('div');
    container.appendChild(modalContainer);
    let content = this.content = document.createElement('div');
    modalContainer.className = 'modal-container';
    content.className = 'content';
    modalContainer.appendChild(content);

    let actions = this.actions = document.createElement('div');
    actions.className = 'actions';
    modalContainer.appendChild(actions);
    actions.innerHTML = `
            <button class="uni-btn">Cancel</button>
            <button class="uni-btn" data-on-ok="1">OK</button>
`;
    actions.addEventListener('click', (e) => {
      if (e.target.tagName == 'BUTTON') {
        if (e.target.dataset.onOk) {
          return this.onOk();
        }
        this.onClose();
      }

    });
  }

  onOk() {
    this.onClose();
  }

  onClose() {
    this.container.className = 'hidden';
    this.onDestroy();
  }

  show() {
    var reg = '/hidden/s';
    this.container.className = this.container.className.replace(reg, '');
  }

  onDestroy() {
    this.container.innerHTML = '';
    this.container.parentNode.removeChild(this.container);
  }
}

class AlertModal extends Modal {
  constructor() {
    super();
    this.container.className = 'uni-modals hidden';
  }

  show({ text }) {
    // super.show();
    // this.content.innerHTML = text;
    alert(text);
  }
}


export default class Modals {

}
Modals.ALERT = () => {
  return new AlertModal();
};
Modals.MODAL = () => {
  return Modal;
};