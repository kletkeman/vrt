chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('/views/window.html', {
  	id: "vrt_main_window",
    innerBounds: {
      width: 1024,
      height: 768
    },
    frame:{
        type : "chrome",
        color: "#000000"
    }
  });
});