export default class EditStack {
    constructor(viewer) {
        this.history = [];
        this.pos = -1;
        this.viewer = viewer;
    }

    refreshHistoryModel(oldMesh, newMesh) {
        this.history.forEach((historyItem) => {
            let list = [
                historyItem.transform.startEditState.elements,
                historyItem.transform.endEditState.elements
            ];

            for (let i = 0; i < list.length; i++) {
                for (let j = 0; j < list[i].length; j++) {
                    let elementTrsnform = list[i][j];
                    let meshName = elementTrsnform.uuid;
                    if (elementTrsnform.mesh) {
                        meshName = elementTrsnform.mesh.uuid;
                    }
                    for (let k = 0; k < oldMesh.length; k++) {
                        if (oldMesh[k].uuid === meshName) {
                            if (elementTrsnform.mesh) {
                                elementTrsnform.mesh = newMesh[k];
                            } else {
                                list[i].splice(j, 1, newMesh[k]);
                            }

                        }
                    }
                }
            }
        });
    }

    // Get the inverse transform at current positition and apply it.
    undo() {
        if (this.pos < 0) {
            throw "No undo history available.";
        }

        var entry = this.history[this.pos--];

        // apply inverse
        entry.transform.startEditState.apply(entry);
        // entry.transform.end();
        //
        // // if update function exists, call it
        // if (entry.onTransform) entry.onTransform();
    }

    // Get the transform at the next position and apply it.
    redo() {
        if (this.pos >= this.history.length - 1) {
            throw "No redo history available.";
        }

        var entry = this.history[++this.pos];

        // apply the transform and update function if given
        entry.transform.endEditState.apply(entry);
        // entry.transform.end();

        // if update function exists, call it
        // if (entry.onTransform) entry.onTransform();
    }

    // Put a new transform onto the stack.
    push(transform, onTransform) {
        if (this.pos < this.history.length - 1) {
            // effectively deletes all entries after this.pos
            this.history.length = this.pos + 1;
        }
        if (transform) this.history.push({
            transform: transform,
            onTransform: onTransform || null
        });
        this.pos++;
    }

    // Clear the stack.
    clear() {
        this.history.length = 0;
        this.pos = -1;
    }
}