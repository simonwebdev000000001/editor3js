import GUtils from "../../../utils";

export default class PointerConductor {


    constructor() {
        let canvas = document.createElement('canvas'),
            size = 512;
        canvas.width = canvas.height = size;
        let ctx = canvas.getContext('2d');
        //ctx.fillRect(0, 0, canvas.width * 0.95, canvas.height);
        let centerX = size / 2,
            centerY = size / 2,
            radius = (size / 2) - 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0, 170, 255, 0.6)";
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = size * 0.2;
        ctx.arc(centerX, centerY, radius - ctx.lineWidth * 0.7, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "rgba(0, 170, 255, 0.18)";
        ctx.stroke();


        this.container = new THREE.Object3D();
        this.measure = {};
        this.pointer = new THREE.Mesh(new THREE.PlaneBufferGeometry(PointerConductor.SIZE, PointerConductor.SIZE), new THREE.MeshBasicMaterial({
            transparent: true,
            depthTest: false,
            side: 2,
            map: new THREE.TextureLoader().load(canvas.toDataURL())
        }));
        this.pointer.conductor = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1));
        this.pointer.conductor.visible = this.pointer.visible = this.container.visible = false;
        this.container.add(this.pointer);
        this.pointer.rotateA = function (inter) {
            if (!inter || !inter.face) return;
            let pointer = this,
                pos = inter.point.clone(),
                normal = inter.face.normal,
                interObj = inter.object,
                normalMatrix = new THREE.Matrix3().getNormalMatrix(interObj.matrixWorld);
            pointer.visible = true;

            normal.applyMatrix3(normalMatrix).normalize();

            pointer.conductor.position.copy(pos.clone().addScaledVector(normal, 1));
            pointer.position.copy(pointer.conductor.position);
            pos.addVectors(normal, pointer.conductor.position);
            pointer.conductor.lookAt(pos);


            let quat = pointer.conductor.quaternion.clone();
            pointer.quaternion.slerp(quat, 1)
        };
    }

    updateSize(dist) {
        let _scale = dist / 1000;
        this.container.traverse((child) => {
            if (child.type == 'Mesh') {
                child.scale.x = child.scale.y = child.scale.z = _scale;
            }

        })

    }

    onSelectTool(TOOL_TYPE) {
        [
            'two_points',
            'angle_three_points',
        ].forEach((el) => {
            if (this.measure[el]) {
                this.measure[el].clear();
                this.measure[el] = null;
            }
        });

        this.container.visible = true;
        switch (TOOL_TYPE) {
            case GUtils.TOOLS.LENGTH_BTW_TWO_POINTS: {
                this.measure.two_points = new MeasuerLengthBtwTowPoints();
                this.container.add(this.measure.two_points.container);
                break;
            }
            case GUtils.TOOLS.ANGLE_BTW_THREE_POINTS: {
                this.measure.angle_three_points = new MeasuerAngleBtwThreePoints();
                this.container.add(this.measure.angle_three_points.container);
                break;
            }
            default: {
                this.container.visible = false;
            }
        }
    }


    addPoint(inter, TOOL_TYPE) {
        if (!inter) return console.warn('No point!');
        switch (TOOL_TYPE) {
            case GUtils.TOOLS.LENGTH_BTW_TWO_POINTS: {
                this.measure.two_points.add(inter, this.pointer.scale);
                break;
            }
            case GUtils.TOOLS.ANGLE_BTW_THREE_POINTS: {
                this.measure.angle_three_points.add(inter, this.pointer.scale);
                break;
            }
        }
    }
}
PointerConductor.SIZE = 22;

export class Measure {
    constructor() {
        this.MAX_POINT_COUNT = 2;
        this.container = new THREE.Object3D();
        this.container._material = new THREE.MeshPhongMaterial({color: '#6d7c8b'});
    }

    clear() {
        this.container.parent.remove(this.container);
    }

    add(inter, scale) {
        if (this.container.points.children.length < this.MAX_POINT_COUNT) {
            let radius = PointerConductor.SIZE * 0.5,
                geometry = new THREE.SphereBufferGeometry(radius, 64, 64);
            let sphere = new THREE.Mesh(geometry, this.container._material);
            sphere.scale.copy(scale);
            sphere.position.copy(inter.point);
            this.container.points.add(sphere);
        } else {
            let firstPoint = this.container.points.children[0];
            firstPoint.parent.remove(firstPoint);
            this.container.points.add(firstPoint);
            firstPoint.position.copy(inter.point);
        }
        this.update();
    }

    update() {

    }
}

export class MeasuerAngleBtwThreePoints extends Measure {
    constructor() {
        super();
        this.MAX_POINT_COUNT = 3;
        this.container.points = new THREE.Object3D();
        this.container.add(this.container.points);
    }


    update() {
        if (this.container.points.children.length >= this.MAX_POINT_COUNT) {
            if (!this.container.line) {
                this.container.line = new THREE.Object3D();
                this.container.add(this.container.line);
            }
            let geometry = new THREE.Geometry();
            geometry.vertices.push(this.container.points.children[0].position);
            geometry.vertices.push(this.container.points.children[1].position);
            geometry.vertices.push(this.container.points.children[2].position);
            let line = this.container.line._line;
            if (!line) {
                line = this.container.line._line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
                    color: this.container._material.color,
                    depthTest: false
                }));
                this.container.line.add(line);
            }
            line.geometry = geometry;

            if (line.label) line.label.parent.remove(line.label);
            let sp = line.label = GUtils.label({
                text: `${THREE.Math.radToDeg(geometry.vertices[0].angleBtwThreePoint(geometry.vertices[1], geometry.vertices[2])).toFixed(GUtils.SETTINGS.ROUND)}${String.fromCharCode(176)}`
            });
            sp.material.depthTest = false;
            let v1 = geometry.vertices[0].getPointInBetweenByPerc(geometry.vertices[1]);
            let v2 = geometry.vertices[2].getPointInBetweenByPerc(geometry.vertices[1]);
            line.label.position.copy(v1.getPointInBetweenByPerc(v2));
            this.container.line.add(line.label);
        }
    }
}

export class MeasuerLengthBtwTowPoints extends Measure {
    constructor() {
        super();
        this.container.points = new THREE.Object3D();
        this.container.add(this.container.points);
    }


    update() {
        if (this.container.points.children.length >= this.MAX_POINT_COUNT) {
            if (!this.container.line) {
                this.container.line = new THREE.Object3D();
                this.container.add(this.container.line);
            }
            let geometry = new THREE.Geometry();
            geometry.vertices.push(this.container.points.children[0].position);
            geometry.vertices.push(this.container.points.children[1].position);
            let line = this.container.line._line;
            if (!line) {
                line = this.container.line._line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
                    color: this.container._material.color,
                    depthTest: false
                }));
                this.container.line.add(line);
            }
            line.geometry = geometry;

            if (line.label) line.label.parent.remove(line.label);
            let sp = line.label = GUtils.label({
                size: geometry.vertices[0].distanceTo(geometry.vertices[1]).toFixed(GUtils.SETTINGS.ROUND)
            });
            sp.position.copy(geometry.vertices[0].getPointInBetweenByPerc(geometry.vertices[1]));
            sp.material.depthTest = false;
            this.container.line.add(line.label);
            // sp.scale.multiplyScalar(scaleL);
        }
    }
}
