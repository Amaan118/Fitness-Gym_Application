const menuIcon = document.querySelector(".menuIcon");
const closeIcon = document.querySelector(".closeIcon");
const nav = document.querySelector(".nav");

if (menuIcon) {
    menuIcon.addEventListener("click", () => {
        if (menuIcon.classList.contains("ham")) {
            menuIcon.classList.remove("ham");
            nav.style.display = 'none';
            menuIcon.style.display = 'flex';
            closeIcon.style.display = 'none';
        }
        else {
            menuIcon.style.display = 'none';
            closeIcon.style.display = 'flex';
            nav.style.display = 'grid';
        }
    });
}

if (closeIcon) {
    closeIcon.addEventListener("click", () => {
        nav.style.display = 'none';
        menuIcon.style.display = 'flex';
        closeIcon.style.display = 'none';
    });
}