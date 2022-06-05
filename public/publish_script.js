document.addEventListener('DOMContentLoaded', e => {
    const el1 = document.getElementById("abstract");
    let abstract = "";
    el1.addEventListener("fileUploadSuccess", function (e) {
        abstract = this.value;
        console.log(abstract);
    });
})
document.addEventListener('DOMContentLoaded', e => {
    const el2 = document.getElementById("analysis");
    let analysis = "";
    el2.addEventListener("fileUploadSuccess", function (e) {
        analysis = this.value;
        console.log(analysis);
    });
})
document.addEventListener('DOMContentLoaded', e => {
    const el3 = document.getElementById("snippet");
    let snippet = "";
    el3.addEventListener("fileUploadSuccess", function (e) {
        snippet = this.value;
        console.log(snippet);
    });
})