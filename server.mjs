import express from "express";
import { engine } from "express-handlebars";
import sql from './db.heroku-pg.js'
import { checkAuthenticated } from "./login.mjs";
import Session from './setup-session.mjs'
const app = express()
import multer from 'multer'

export let prosTaAstra = { title: "pros-ta-astra", normal_titlos: "Προς τ'άστρα" };

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `./user-data/uploads/`);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.session.loggedUserId}_${file.fieldname}.pdf`);
    },
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "pdf") {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter })

app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', '.hbs');
app.use(express.static('public/'));
app.use(Session);
app.use(express.urlencoded({ extended: true }));


const redirectHome = (req, res, next) => {
    console.log('redirect...', req.session)
    if (!req.session.userID) {
        res.redirect('/');
    } else {
        next();
    }
};

let returnTo = "/";

console.log(process.env.PORT)
// Εκκίνηση του εξυπηρετητή
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
    console.log(`Συνδεθείτε στη σελίδα: http://localhost:${PORT}`);
});


app.get("/", (req, result) => {
    sql.query(`SELECT * FROM vivlio1 LIMIT 7`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            // details = res.rows[0];
            // console.log(res.rows);
            returnTo = req.originalUrl;
            // console.log('Details2', details);
            result.render('index', {
                books: res.rows,
                layout: checkAuthenticated(req) ? "main-logged-in" : "main"
            });
        }
    });
    // returnTo = req.originalUrl;
    // console.log("GET / session=", req.session);
    // console.log(req.query)
    // res.render("index", { layout: checkAuthenticated(req) ? "main-logged-in" : "main" });
})

app.get("/signup", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("signup");
})

app.get("/publish", (req, res) => {
    returnTo = req.originalUrl;
    if (checkAuthenticated(req) == false) {
        res.redirect("/login");
    }
    else {
        console.log("GET / session=", req.session);
        res.render("publish", { layout: checkAuthenticated(req) ? "main-logged-in" : "main" });
    }
})

app.post("/upload", upload.fields([{ name: 'summary', maxCount: 1 }, { name: 'analysis', maxCount: 1 }, { name: 'chapter', maxCount: 1 }]), (req, res) => {
    console.log("GET / session=", req.session);
    // console.log(req)
    res.render("publish", { layout: checkAuthenticated(req) ? "main-logged-in" : "main" });
})

app.get("/admin", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("admin", { layout: "main-logged-in" });
})

app.get("/best-sellers", (req, result) => {

    sql.query(`SELECT * FROM vivlio1`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            // details = res.rows[0];
            console.log(res.rows);
            returnTo = req.originalUrl;
            // console.log('Details2', details);
            result.render('best-sellers', {
                books: res.rows,
                layout: checkAuthenticated(req) ? "main-logged-in" : "main"
            });
        }
    });

    // returnTo = req.originalUrl;
    // console.log("GET / session=", req.session);
    // res.render("best-sellers", { layout: checkAuthenticated(req) ? "main-logged-in" : "main" });
})

app.get("/signup", (req, res) => {
    returnTo = req.originalUrl;
    console.log("GET / session=", req.session);
    res.render("signup");
})

app.get("/login", (req, res) => {
    // console.log(req);
    // console.log("GET / session=", req.session);
    res.render("login");
})

app.post('/auth', (req, res) => {
    console.log(req.body.password)
    console.log('test');
    if (req.body.password == '123') {
        req.session.loggedUserId = 1;
        // app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main-logged-in' }));
        res.redirect(returnTo)
    }
    else {
        res.render("login");
    }
})

app.get("/logout", (req, res) => {
    // console.log(req);
    // console.log("GET / session=", req.session);
    // app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
    req.session.destroy();
    res.redirect(returnTo);
})

app.get('/book/:title', (req, result) => {
    let details = {};
    sql.query(`SELECT * FROM vivlio1 WHERE titlos='${req.params.title}'`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            details = res.rows[0];
            console.log("Details1", details);
            returnTo = req.originalUrl;
            console.log('Details2', details);
            result.render('book', {
                title: details.titlos, selides: details.selides, syggrafeas: details.syggrafeas, normal_titlos: details.normal_titlos, description: details.description, isbn: details.isbn, timi: details.timi, katigoria: details.katigoria, etos_ekdosis: details.etos_ekdosis, glwssa: details.glwssa,
                layout: checkAuthenticated(req) ? "main-logged-in" : "main"
            });
        }
    });

})

// app.get('/book/pros-ta-astra', (req, res) => {
//     console.log('GET / session=', req.session);
//     res.render('book');
// })

