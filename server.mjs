import express from "express";
import { engine } from "express-handlebars";
import sql from './db.heroku-pg.js'
import { checkAuthenticated } from "./login.mjs";
import Session from './setup-session.mjs'
const app = express()
import multer from 'multer'
import bcrypt from 'bcrypt'
let log = await import('./login.mjs')

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

app.post('/auth', (req, result) => {
    
    
    log.getUserByEmail(req.body.email, (err,user)=> {
        console.log(req.body.email)
        if (user == undefined) {
            result.render('login', { message: 'Δε βρέθηκε χρήστης με αυτό το email' });
        }
        else {
            const match = bcrypt.compare(req.body.password, user.password, (err, match) => {
                if (match) {
                    //Θέτουμε τη μεταβλητή συνεδρίας "loggedUserId"
                    req.session.loggedUserId = user.afm;
                    console.log(returnTo)
                    console.log(user.afm)
                    //Αν έχει τιμή η μεταβλητή req.session.originalUrl, αλλιώς όρισέ τη σε "/" 
                    // returnTo = req.originalUrl || "/";
                    // res.redirect("/");
                    result.redirect(returnTo);
                }
                else {
                    console.log('getop')
                    result.render("login", { message: 'Ο κωδικός πρόσβασης είναι λάθος' })
                }
            })
        }
    })
    })
    // console.log(req.body.password)
    // const psswd = bcrypt.hash(req.body.password, 10);
    // console.log('test');

    // sql.query({text: `SELECT password FROM users WHERE email=$1`, values:[req.body.email]}, (err, res) => {
    //     if (err) {
    //         console.log('x1')
    //         console.log(err.message);
    //         result.render("login");
    //     }
    //     else {
    //         console.log(req.body.password+'test'+res.rows[0])
    //         if (bcrypt.compare(req.body.password, res.rows[0])){
    //             console.log('x3')
    //             req.session.loggedUserId = 1;
    //             result.redirect(returnTo)
    //         }
    //         else{
    //             console.log('x4')
    //             console.log(res.rows[0].password);
    //             console.log(psswd);
    //             result.render("login");
    //         }
    //         // console.log("Details1", details);
    //         // returnTo = req.originalUrl;
    //         // result.render("login");
    //         // console.log('Details2', details);
    //         // result.render('book', {
    //         //     title: details.titlos, selides: details.selides, syggrafeas: details.syggrafeas, normal_titlos: details.normal_titlos, description: details.description, isbn: details.isbn, timi: details.timi, katigoria: details.katigoria, etos_ekdosis: details.etos_ekdosis, glwssa: details.glwssa,
    //         //     layout: checkAuthenticated(req) ? "main-logged-in" : "main" });
    //     }
    // });
    // if (req.body.password == '123') {
    //     req.session.loggedUserId = 1;
    //     // app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main-logged-in' }));
    //     res.redirect(returnTo)
    // }
    // else {
    //     res.render("login");
    // }
// })

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

