import express from "express";
import { engine } from "express-handlebars";
import dotenv from 'dotenv';
import http from 'http';

const app = express()


app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.use(express.static('public'));
app.use('/public/images', express.static('images'));


const redirectHome = (req, res, next) => {
    console.log('redirect...', req.session)
    if (!req.session.userID) {
        res.redirect('/');
    } else {
        next();
    }
};

console.log(process.env.PORT)
// Εκκίνηση του εξυπηρετητή
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
    console.log(`Συνδεθείτε στη σελίδα: http://localhost:${PORT}`);
});


app.get("/", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("index");
})

app.get("/index", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("index");
})

app.get("/signup", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("signup");
})

app.get("/publish", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("publish");
})

app.get("/admin", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("admin");
})

app.get("/best-sellers", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("best-sellers");
})

app.get("/signup", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("signup");
})



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