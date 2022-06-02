import express from "express";
import { engine } from "express-handlebars";
import dotenv from 'dotenv';
import http from 'http';
import { checkAuthenticated, showLogInForm } from "./login.mjs";

const app = express()


app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.use(express.static('public'));

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

app.get("/signup", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("signup");
})

app.get("/publish", (req, res) => {
    if (checkAuthenticated()==false){
        res.redirect("/login");
    }
    else{
        console.log("GET / session=", req.session);
        res.render("publish");}
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

// app.get('/books/:title', (req, res) => {
//     console.log('GET / session=', req.session);
//     res.render('book');
// })

app.get('/book/pros-ta-astra', (req, res) => {
    console.log('GET / session=', req.session);
    res.render('book');
})