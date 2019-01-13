export default class EditStack {
    constructor(){
        this.history = [];
        this.pos = -1
    }
    // Get the inverse transform at current positition and apply it.
    undo () {
        if (this.pos < 0) {
            throw "No undo history available.";
        }

        var entry = this.history[this.pos--];

        // apply inverse
        entry.transform.startEditState.apply();
        // entry.transform.end();
        //
        // // if update function exists, call it
        // if (entry.onTransform) entry.onTransform();
    }

    // Get the transform at the next position and apply it.
    redo () {
        if (this.pos >= this.history.length-1) {
            throw "No redo history available.";
        }

        var entry = this.history[++this.pos];

        // apply the transform and update function if given
        entry.transform.endEditState.apply();
        // entry.transform.end();

        // if update function exists, call it
        // if (entry.onTransform) entry.onTransform();
    }

    // Put a new transform onto the stack.
    push (transform, onTransform) {
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
    clear () {
        this.history.length = 0;
        this.pos = -1;
    }
}