const graphFunctions = require('./graphFunctions.js.js');
const graph = require('./graphFunctions');

const DEFAULT_TIME = "1h";

function getTime(mult, oldGraph, oldStartIndex, oldStart) {
    if (mult[mult.length - 1] === 'h') {
        var newStartTime = 3600000 * parseInt(mult.substring(0, mult.length - 1));
        return getNewGraph(newStartTime, oldGraph, oldStartIndex, oldStart);
    }
    else if (mult[mult.length - 1] === 'd') {
        var newStartTime = 24 * 3600000 * parseInt(mult.substring(0, mult.length - 1));
        return getNewGraph(newStartTime, oldGraph, oldStartIndex, oldStart);
    }
    else {
        var newStartTime = 60000 * parseInt(mult.substring(0, mult.length - 1));
        return getNewGraph(newStartTime, oldGraph, oldStartIndex, oldStart);
    }
}

function formatUptime(uptime) {
    var unit = 'second';
    uptime = parseFloat(uptime);
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }
    uptime = uptime.toFixed(4) + ' ' + unit;
    return uptime;
}

function getNewGraph(newStart, oldGraph, oldStartIndex, oldStart) {
    while (oldGraph[oldStartIndex] != "&") {
        oldStart = oldStart + oldGraph[oldStartIndex];
        oldStartIndex++;
    }
    var oldEnd = "";
    var oldEndIndex = oldGraph.indexOf("to=") + 3;
    while (oldGraph[oldEndIndex] != "&" && oldEndIndex < oldGraph.length) {
        oldEnd = oldEnd + oldGraph[oldEndIndex];
        oldEndIndex++;
    }
    var time = new Date().getTime();
    var newGraph = oldGraph.replace(oldStart, "" + time - newStart);
    newGraph = newGraph.replace(oldEnd, "" + time);
    return { newGraph, oldStartIndex, oldStart };
}

var exported = {
    DEFAULT_TIME,
    getNewGraph,
    formatUptime,
    getTime
}

module.exports = exported;