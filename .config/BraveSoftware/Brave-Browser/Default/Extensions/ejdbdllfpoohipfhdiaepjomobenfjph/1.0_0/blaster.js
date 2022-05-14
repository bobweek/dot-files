setTimeout(function() {
    var target = document.getElementById('app').childNodes[0].childNodes[0];
    target.style.overflowY = 'auto';

    var overlay = target.childNodes[target.childNodes.length - 1];
    overlay.style.display = 'none';

    document.getElementById('gateway-content').style.display = 'none';
}, 5000);
