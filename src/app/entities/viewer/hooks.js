THREE.Mesh.prototype._boxSize = function () {
    let _helper = new THREE.BoxHelper(this),
        {
            width,
            height,
            depth
        } = _helper._boxSize();

    return {
        _helper,
        width,
        height,
        depth
    }
}
THREE.BoxHelper.prototype._boxSize = function () {
    let _helper = this;
    _helper.geometry.computeBoundingBox();
    let _box = _helper.geometry.boundingBox,
        height = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.min.y, _box.max.z)),
        width = _box.min.distanceTo(new THREE.Vector3(_box.max.x, _box.min.y, _box.min.z)),
        depth = _box.min.distanceTo(new THREE.Vector3(_box.min.x, _box.max.y, _box.min.z));

    return {
        width,
        height,
        depth
    }
}