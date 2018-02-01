(function(socket) {
  var acetateRoot = document.createElement("div");
  acetateRoot.style.position = "fixed";
  acetateRoot.style.top = "0";
  acetateRoot.style.left = "0";
  acetateRoot.style.right = "0";
  acetateRoot.style.bottom = "0";
  acetateRoot.style.width = "100%";
  acetateRoot.style.height = "100%";
  acetateRoot.style.background = "#7C8D9B";
  acetateRoot.style.color = "white";
  acetateRoot.style.fontFamily =
    '"Lucida Grande","Lucida Sans Unicode","Lucida Sans","Trebuchet MS",Tahoma,sans-serif';
  acetateRoot.style.textAlign = "left";
  acetateRoot.style.padding = "1rem";
  acetateRoot.style.zIndex = "100000";
  acetateRoot.style.overflow = "scroll";
  acetateRoot.style.boxSizing = "border-box";

  var acetateTitle = document.createElement("h1");
  acetateTitle.style.fontSize = "3rem";
  acetateTitle.innerText = "Acetate Error";
  acetateTitle.style.background = "#7C8D9B";
  acetateTitle.style.color = "white";
  acetateTitle.border = "none";
  acetateRoot.appendChild(acetateTitle);

  var acetateMessage = document.createElement("p");
  acetateMessage.style.fontSize = "2.rem";
  acetateMessage.style.lineHeight = "1.25";
  acetateMessage.style.fontFamily = "monospace";
  acetateMessage.style.background = "#7C8D9B";
  acetateMessage.style.color = "white";
  acetateMessage.border = "none";
  acetateRoot.appendChild(acetateMessage);

  var acetateStack = document.createElement("pre");
  acetateStack.style.fontSize = "1.5rem";
  acetateStack.style.border = "3px dashed #8A9BAB";
  acetateStack.style.margin = "1rem 0";
  acetateStack.style.padding = "1rem";
  acetateStack.style.overflow = "auto";
  acetateStack.style.background = "#7C8D9B";
  acetateStack.style.color = "white";
  acetateStack.border = "none";
  acetateRoot.appendChild(acetateStack);

  socket.on("acetate:init", function() {
    socket.emit("acetate:client-info", {
      url: window.location.pathname
    });
  });

  socket.on("acetate:connected", function() {
    log("[Acetate]", "connected", []);
  });

  socket.on("acetate:log", function(e) {
    log(e.prefix || "[Acetate]", e.message, e.extras || []);
  });

  socket.on("acetate:fullscreen-message", function(e) {
    showFullScreenMessage(e.title, e.message, e.extra, e.timeout);
  });

  socket.on("acetate:clear-fullscreen", function() {
    document.body.removeChild(acetateRoot);
  });

  function log(prefix, message, extras) {
    var args = [prefix, message].concat(extras);
    console.log.apply(console, args); // eslint-disable-line no-console
  }

  function showFullScreenMessage(title, message, extra, timeout) {
    acetateTitle.innerText = title;
    acetateMessage.innerText = message;
    acetateStack.innerText = extra;

    document.body.appendChild(acetateRoot);

    if (timeout) {
      setTimeout(function() {
        document.body.removeChild(acetateRoot);
      }, timeout);
    }
  }
})(window.___browserSync___.socket);
