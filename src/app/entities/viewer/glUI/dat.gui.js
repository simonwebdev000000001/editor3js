import EditStack from '../editStack/idnex';

export default class DatGui {
    constructor(viewer) {
        let gui = this.gui = new dat.GUI();
        gui.domElement.parentNode.style.right = '110px';

        this.layerHeight = .1;
        this.lineWidth = 0.1;
        this.sliceAxis = "z";
        this.supportSliceFolder = this.gui.addFolder("Supports & Slicing",
            "Generate supports, slice the mesh, and export the resulting G-code.");
        this.supportAngle = 45;
        this.supportSpacingFactor = 24;
        this.supportRadius = this.lineWidth * 4;
        this.supportTaperFactor = 0.25;
        this.supportSubdivs = 16;
        this.supportRadiusFnName = "sqrt";
        this.supportRadiusFnK = 0.01;
        // can't set support radius fn directly from dat.gui because it returns the
        // function stringified, so just set fn name and then convert it to the fn
        this.supportRadiusFnMap = {
            constant: SupportGenerator.RadiusFunctions.constant,
            sqrt: SupportGenerator.RadiusFunctions.sqrt
        };

        // this.printout = console;//new Printout();
        this.printout = new Printout(6, viewer.container);
        this.editStack = new EditStack(viewer);

        this.buildSupportSliceFolder();
        this.gui.add(this, "undo").name("Undo")
            .title("Undo the last edit action.");
        this.gui.add(this, "redo").name("Redo")
            .title("Redo the previous undo.");
    }

    generateSupports = function () {
        if (this.model) {
            if (this.supportRadius < this.lineWidth) {
                this.printout.warn("Support radius is lower than the planar resolution.");
            }
            else if (this.supportRadius * this.supportTaperFactor < this.lineWidth) {
                this.printout.warn("Support taper radius is lower than the planar resolution. This may result in missing support slices.");
            }

            this.model.supportTools.generateSupports({
                angle: this.supportAngle,
                resolution: this.lineWidth * this.supportSpacingFactor,
                layerHeight: this.layerHeight,
                radius: this.supportRadius,
                taperFactor: this.supportTaperFactor,
                subdivs: this.supportSubdivs,
                radiusFn: this.supportRadiusFnMap[this.supportRadiusFnName],
                radiusFnK: this.supportRadiusFnK,
                axis: this.sliceAxis
            });
        } else {
            this.printout.warn("Require selected model");
        }
    }

    removeSupports() {
        if (this.model.supportTools) this.model.supportTools.removeSupports();
    }

    buildSupportSliceFolder() {
        var supportSliceFolder = this.supportSliceFolder;
        this.clearFolder(supportSliceFolder);

        if (this.sliceModeOn) {
            this.buildSliceFolder(supportSliceFolder);
        }
        else {
            supportSliceFolder.add(this, "layerHeight", .0001, 1).name("Layer height")
                .title("Height of each mesh slice layer.");
            supportSliceFolder.add(this, "lineWidth", .0001, 1).name("Line width")
                .title("Width of the print line. Affects minimum resolvable detail size, decimation of sliced contours, and extrusion in the exported G-code.");
            supportSliceFolder.add(this, "sliceAxis", ["x", "y", "z"]).name("Up axis")
                .title("Axis normal to the slicing planes.");

            var supportFolder = supportSliceFolder.addFolder("Supports", "Generate supports for printing the model.");
            this.buildSupportFolder(supportFolder);

        }
    }

    clearFolder(folder) {
        for (var i = folder.__controllers.length - 1; i >= 0; i--) {
            folder.remove(folder.__controllers[i]);
        }
        for (var folderName in folder.__folders) {
            folder.removeFolder(folder.__folders[folderName]);
        }
    }

    buildSupportFolder(folder) {
        folder.add(this, "supportAngle", 0, 89).name("Angle")
            .title("Angle defining faces that need support.");
        folder.add(this, "supportSpacingFactor", 1, 100).name("Spacing factor")
            .title("Greater spacing factor makes supports more sparse.");
        folder.add(this, "supportRadius", 0.0001, 1).name("Radius")
            .title("Base radius for supports. NB: if this radius is too low in comparison with line width, the supports may not print correctly.");
        folder.add(this, "supportTaperFactor", 0, 1).name("Taper factor")
            .title("Defines how much the supports taper when connected to the mesh.");
        folder.add(this, "supportSubdivs", 4).name("Subdivs")
            .title("Number of subdivisions in the cylindrical support struts.");
        folder.add(this, "supportRadiusFnName", ["constant", "sqrt"]).name("Radius function")
            .title("Function that defines how support radius grows with the volume it supports; default is square root.");
        folder.add(this, "supportRadiusFnK", 0).name("Function constant")
            .title("Multiplicative constant that modifies the support radius function.");
        folder.add(this, "generateSupports").name("Generate supports")
            .title("Generate the supports.");
        // folder.add(this, "removeSupports").name("Remove supports")
        //     .title("Remove generated supports.");
    }


    undo() {
        try {
            this.editStack.undo();
        } catch (e) {
            if (e.message) {
                this.editStack.clear();
            }
            this.printout.warn(e);
            console.error(e);
        }
    }

    redo() {
        try {
            this.editStack.redo();
        }
        catch (e) {
            if (e.message) {
                this.editStack.clear();
            }
            this.printout.warn(e);
            console.error(e);
        }
    }
}