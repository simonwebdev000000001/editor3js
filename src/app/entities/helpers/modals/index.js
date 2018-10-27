class Modal {
    constructor() {
        let container = this.container = document.createElement('div');
        container.className = "uni-modals hidden";
        document.body.appendChild(container);

        let content = this.content = document.createElement('div');
        content.className = "content";
        this.container.appendChild(content);

        let actions = this.actions = document.createElement('div');
        actions.className = "actions";
        this.container.appendChild(actions);
        actions.innerHTML = `<button class="uni-btn">Cancel</button>`;
        actions.querySelector('button').addEventListener('click', (e) => this.onOk());

    }
    onOk() {
        this.container.className = "hidden";
    }
    show() {
        this.container.className = this.container.className.replace(/hidden/s, "");
    }

    onDestroy() {

    }
}

class AlertModal extends Modal {
    constructor() {
        super();
    }

    show({ text }) {
        // super.show();
        // this.content.innerHTML = text;
        alert(text);
    }
}

let modals = {
    ALERT: null
}
document.addEventListener("DOMContentLoaded", function () {
    modals = {
        ALERT: new AlertModal()
    }
});


export default class Modals {
    static ALERT = () => {
        return modals.ALERT;
    }
}