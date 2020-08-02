window.addEventListener("load", ()=>{
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', chrome.extension.getURL('/js/inject.js'));
        document.body.appendChild(s);
}, false);
