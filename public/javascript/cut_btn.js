let msg_cut = document.getElementById('cut');

if (msg_cut) {
    msg_cut.addEventListener('click', function () {
        this.parentNode.style.display = 'none';
    });
}