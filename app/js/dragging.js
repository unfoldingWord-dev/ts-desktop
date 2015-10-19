
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var dragid = ev.dataTransfer.getData("text");
    var dragelement = document.getElementById(dragid);
    var targetelement = ev.target;
    var parentelement = targetelement.parentNode;
    parentelement.insertBefore(dragelement, targetelement);
}
