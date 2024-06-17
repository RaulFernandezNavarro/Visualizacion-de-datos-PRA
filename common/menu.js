// menu.js
document.addEventListener("DOMContentLoaded", function() {
    const menuBtn = document.getElementById("menu-btn");
    const menu = document.getElementById("menu");
    const menuCloseBtn = document.getElementById("menu-close-btn");

    menuBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        menu.style.width = "250px";
    });

    menuCloseBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        menu.style.width = "0";
    });

    // Close the menu when clicking outside
    document.addEventListener("click", function(event) {
        if (!menu.contains(event.target) && event.target !== menuBtn) {
            menu.style.width = "0";
        }
    });

    // Prevent clicks inside the menu from closing it
    menu.addEventListener("click", function(event) {
        event.stopPropagation();
    });
});
