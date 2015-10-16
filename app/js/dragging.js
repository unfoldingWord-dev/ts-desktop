
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var childid = ev.dataTransfer.getData("text");
    var child = document.getElementById(childid);
    var parent = ev.target;
    parent.insertBefore(child, parent.firstChild);
}
