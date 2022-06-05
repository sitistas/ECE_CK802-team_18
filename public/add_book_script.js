document.addEventListener('DOMContentLoaded', e => {
    const el = document.getElementById("book_cover_url");
    let bookCoverUrl = "";
    el.addEventListener("fileUploadSuccess", function (e) {
        bookCoverUrl = this.value;
        console.log(bookCoverUrl);
    });
})