import GUtils from "../../../utils";
import GLControls from "../index";

export default class ScaleControls extends GLControls {
    constructor({parent}) {
        super(parent.viewer.camera);
        this.controls = parent;
        this._initAxises();
        this.mode = this._plane.mode = 'scale';
        this.helpers = {
            x: 'width',
            y: 'depdth',
            z: 'height',
        }
    }

    _initAxises() {
        let axes = this.container = new THREE.Object3D(),
            self = this,
            _delta = 0.25,
            {height, width, depth} = this.controls.controls._boxSize(),
            max = Math.max(height, width, depth),
            axises = [
                {
                    dimension: 'Y',
                    size: max * _delta,
                    points: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 1, 0)
                    ],
                    color: GUtils.COLORS.BLUE,
                    vector_translate: new THREE.Vector3(-1, 0, 0),
                },
                {
                    dimension: 'Z',
                    size: max * _delta,
                    points: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 0, 1)
                    ],
                    quaternion: new THREE.Vector3(1, 0, 0),
                    color: GUtils.COLORS.RED
                },
                {
                    dimension: 'X',
                    size: max * _delta,
                    points: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(1, 0, 0)
                    ],

                    vector_translate: new THREE.Vector3(0, -1, 0),
                    quaternion: new THREE.Vector3(0, 0, -1),
                    color: GUtils.COLORS.GREEN
                },
                {
                    dimension: 'XYZ',
                    size: max * _delta * 0.5,
                    points: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(1, 1, 1)
                    ],

                    color: GUtils.COLORS.YELLOW
                }
            ];


        axises.forEach((el, index) => {
            let _points = [...el.points],
                dist = el.size,
                direction = _points[1].clone();

            _points[1] = _points[0].clone().addScaledVector(direction, dist);

            let
                curve = new THREE.CatmullRomCurve3(_points),
                size = dist * 0.05,
                conusHeight = 10 * size,
                geometry = new THREE.TubeBufferGeometry(curve, 10, size, 10, true),
                material = new THREE.MeshPhongMaterial({
                    color: GUtils.COLORS.GRAY,
                    transparent: true,
                    opacity: 0.7
                }),
                mesh = new THREE.Mesh(geometry, material);

            geometry = new THREE.CylinderBufferGeometry(0, 2 * size, conusHeight, 64);
            geometry.rotateX(Math.PI / 2);
            let cone = new THREE.Mesh(geometry, material);
            cone.position.addScaledVector(direction, dist);
            cone.lookAt(cone.position.clone().addScaledVector(direction, dist));
            axes.add(mesh);
            mesh.add(cone);
            mesh.name = cone.name = el.dimension;
            mesh._category = cone._category = 2;
            mesh.isIntersectable = cone.isIntersectable = true;
            mesh._mouseover = cone._mouseover = function (ev) {
                this.material.opacity = 1;
                document.body.style.cursor = 'col-resize';
                self.pointerHover(this);

            }
            mesh._mouseoout = cone._mouseoout = function (ev) {
                this.material.opacity = 0.7;
                self.pointerHover();
            }
            mesh._mousedown = cone._mousedown = function (ev) {
                self.updateMtrix();
                self.pointerDown(self.getPointer(ev));
                self.initLabels(this);
                self.controls.viewer.snapShotTransform(true);
            }
            mesh._mouseup = cone._mouseup = function (ev) {
                this.material.opacity = 0.7;
                self.removeLabels();
                self.pointerUp();
                self.controls.viewer.snapShotTransform();
            }
            mesh._mousemove = cone._mousemove = function (ev) {
                document.body.style.cursor = 'col-resize';
                self.pointerMove(self.getPointer(ev));
                self.updateLabels();

                // self.controls.viewer.transformControls.scale.copy(self.editObject().scale);
                self.controls.updateArrowPst();
            }
        })
        this.container.position.copy(this.controls.controls.geometry.boundingBox.max);
    }


    editObject() {
        return this.controls.controls.parent;
    }

    pointerMove(pointer) {
        let {
                axis,
                ray,
                _plane,
                pointStart,
                _scaleStart,
                pointEnd,
                _tempVector,
                worldPositionStart,
            } = this,
            object = this.editObject();
        ray.setFromCamera(pointer, this.camera);

        let planeIntersect = ray.intersectObjects([_plane], true)[0] || false;

        if (planeIntersect === false) return;

        pointEnd.copy(planeIntersect.point).sub(worldPositionStart);
        pointEnd.addScalar(pointEnd.distanceTo(pointStart) *GUtils.CONTROLS.INCREMENTS.SCALE);

        if (axis.search('XYZ') !== -1) {

            var d = pointEnd.length() / pointStart.length();

            if (pointEnd.dot(pointStart) < 0) d *= -1;

            _tempVector.set(d, d, d);

        } else {

            _tempVector.copy(pointEnd).divide(pointStart);

            if (axis.search('X') === -1) {
                _tempVector.x = 1;
            }
            if (axis.search('Y') === -1) {
                _tempVector.y = 1;
            }
            if (axis.search('Z') === -1) {
                _tempVector.z = 1;
            }

        }
        // Apply scale

        object.scale.copy(_scaleStart).multiply(_tempVector);
    }

    removeLabels() {
        this.container.labelAngleContainer.innerHTML = '';
        this.container.labelAngleContainer.parentNode.removeChild(this.container.labelAngleContainer);
    }

    updateLabels() {
        let pst = this.controls.viewer.toScreenPosition(this.container);
        let div = this.container.labelAngleContainer,
            editObject = this.editObject();

        div.style.left = `${pst.x}px`;
        div.style.top = `${pst.y}px`;

        if (this.axis == 'XYZ') {
            div.innerHTML = '';
            this.axis.split("").forEach((dimension) => {
                let _axis = dimension.toLowerCase(),
                    size = editObject.scale[_axis] * this.size[_axis];
                dimension = dimension.toLowerCase();
                div.innerHTML += `<span>${ this.helpers[dimension]} = ${size.toFixed(GUtils.SETTINGS.ROUND)}</span><br>`;
            })
        } else {
            let _axis = this.axis.toLowerCase(),
                size = editObject.scale[_axis] * this.size[_axis];
            div.innerHTML = `<span>${this.helpers[_axis]} = ${size.toFixed(GUtils.SETTINGS.ROUND)}</span>`;
        }

    }

    initLabels() {
        this.size = this.controls.controls._boxSize();
        let div = this.container.labelAngleContainer = document.createElement('div');
        div.className = 'label-container label-scale';
        div.style.backgroundColor = GUtils.COLORS.RED;
        div.style.color = 'white';
        this.controls.viewer.labelContainer.appendChild(div);
    }
}