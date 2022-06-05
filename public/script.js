function popupForm() {
    document.getElementById("sign-in").style.display = "block";
    document.getElementById("dim").style.display = "block"
}
function closeForm() {
    document.getElementById("sign-in").style.display = "none";
    document.getElementById("dim").style.display = "none"
}

function popupSearch() {
    document.getElementById("search-bar").style.display = "block";
    document.getElementById("dim").style.display = "block";
}

function closeSearch() {
    document.getElementById("search-bar").style.display = "none";
    document.getElementById("dim").style.display = "none";
}


document.addEventListener('DOMContentLoaded', e => {
    const el = document.getElementById("book_cover_url");
    let bookCoverUrl = "";
    el.addEventListener("fileUploadSuccess", function (e) {
        bookCoverUrl = this.value;
        console.log(bookCoverUrl);
    });
})