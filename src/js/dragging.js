'use strict';

function allowDrop(ev) { // jshint ignore:line
    ev.preventDefault();
}

function drag(ev) { // jshint ignore:line
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) { // jshint ignore:line
    ev.preventDefault();
    var dragid = ev.dataTransfer.getData("text");
    var dragelement = document.getElementById(dragid);
    var targetelement = ev.target;
    var parentelement = targetelement.parentNode;
    parentelement.insertBefore(dragelement, targetelement);
}
