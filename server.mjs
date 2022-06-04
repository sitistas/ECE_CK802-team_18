import express from "express";
import { engine } from "express-handlebars";
import sql from './db.heroku-pg.js'
import { checkAuthenticated } from "./login.mjs";
import Session from './setup-session.mjs'
const app = express()
import multer from 'multer'
import bcrypt from 'bcrypt'
let log = await import('./login.mjs')

export let prosTaAstra = { title: "pros-ta-astra", normal_title: "Προς τ'άστρα" };

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
    sql.query(`SELECT * FROM book LIMIT 7`, (err, res) => {
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
                layout: req.session.loggedUserId ? (req.session.loggedUserRole=='admin'? "main-admin" : "main-user") : "main"
            });
        }
    });
    // returnTo = req.originalUrl;
    console.log("GET / session=", req.session);
    // console.log(req.query)
    // res.render("index", { layout: checkAuthenticated(req) ? "main-user" : "main" });
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
        res.render("publish", { layout: req.session.loggedUserRole=='admin'? "main-admin" : "main-user"});
    }
})

app.post("/upload", upload.fields([{ name: 'summary', maxCount: 1 }, { name: 'analysis', maxCount: 1 }, { name: 'chapter', maxCount: 1 }]), (req, res) => {
    console.log("GET / session=", req.session);
    // console.log(req)
    res.render("publish", { layout: "main-user", message: "Το ανέβασμα ολοκληρώθηκε" });
})

app.get("/admin", (req, res) => {
    if (req.session.loggedUserRole=='admin'){
    console.log("GET / session=", req.session);
    res.render("admin", { layout: "main-admin" });}
    else {res.redirect("/")}
})

app.get("/best-sellers", (req, result) => {
    sql.query(`SELECT * FROM book`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            // details = res.rows[0];
            // console.log(res.rows);
            returnTo = req.originalUrl;
            // console.log('Details2', details);
            result.render('best-sellers', {
                books: res.rows,
                page_title: 'Best Sellers',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole=='admin'? "main-admin" : "main-user") : "main"
            });
        }
    });
})

app.get("/latest", (req, result) => {
    sql.query(`SELECT * FROM book ORDER BY release_year DESC`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            // details = res.rows[0];
            // console.log(res.rows);
            returnTo = req.originalUrl;
            // console.log('Details2', details);
            result.render('latest', {
                books: res.rows,
                page_title: 'Νέες κυκλοφορίες',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole=='admin'? "main-admin" : "main-user") : "main"
            });
        }
    });
})


app.get("/signup", (req, res) => {
    console.log("GET / session=", req.session);
    res.render("signup");
})

app.get("/login", (req, res) => {
    // console.log(req);
    // console.log("GET / session=", req.session);
    res.render("login");
})

app.post("/register", async (req, result) => {
    log.getUserByEmail(req.body.email, (err,user)=> {
        console.log(req.body.email)
        if (user != undefined) {
            result.render('signup', { message: 'Υπάρχει ήδη χρήστης με αυτό το email' });
        }})

    log.getUserByAFM(req.body.afm, (err,user)=> {
        console.log(req.body.email)
        if (user != undefined) {
            result.render('signup', { message: 'Υπάρχει ήδη χρήστης με αυτό το ΑΦΜ' });
        }})
    
    console.log(req.body)
    if(req.body.password!=req.body.repeatPassword) {
            result.render('signup', { message: 'Οι κωδικοί πρόσβασης δεν ταιριάζουν' });
    }

    try {
        const psswd = await bcrypt.hash(req.body.password, 10);

        const query = {
            text: 'INSERT INTO users (afm, email, password, name, birthdate, phone, address, city) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            values: [req.body.afm, req.body.email, psswd, req.body.name, req.body.dob, req.body.tel,req.body.address, req.body.city]
        }

        sql.query(query, (err, res) => {
            if (err){
            // console.log(err)
            result.render('signup', { message: 'Προέκυψε κάποιο πρόβλημα. Ελέγξτε τα στοιχεία σας και προσπαθήστε ξανά' });}
            else {
                result.render('signup', { success: 'Επιτυχής εγγραφή!' });
            }
        })
    } catch (err) {
        // console.log(err)
        result.render('signup', { message: 'Προέκυψε κάποιο πρόβλημα. Ελέγξτε τα στοιχεία σας και προσπαθήστε ξανά' });
    }
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
                    req.session.loggedUserRole = user.is_admin ? "admin":"user";
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
    

app.get("/logout", (req, res) => {
    // console.log(req);
    // console.log("GET / session=", req.session);
    // app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
    req.session.destroy();
    res.redirect(returnTo);
})

app.get('/book/:title', (req, result) => {
    let details = {};
    sql.query(`SELECT * FROM book JOIN writes on book.isbn=writes.isbn join users on writes.afm=users.afm WHERE title='${req.params.title}'`, (err, res) => {
        if (err) {
            console.log(err.message);
            result.redirect('/')
        }
        else {
            details = res.rows[0];
            console.log("Details1", details);
            returnTo = req.originalUrl;
            console.log('Details2', details);
            result.render('book', {
                title: details.title, pages: details.pages, author: details.name, normal_title: details.normal_title, description: details.description, isbn: details.isbn, price: details.price, category: details.category, release_year: details.release_year, language: details.language,
                layout: req.session.loggedUserId ? (req.session.loggedUserRole=='admin'? "main-admin" : "main-user") : "main"
            });
        }
    });

})

app.get('/profile', (req, result) => {
    returnTo = req.originalUrl;
    if (!req.session.loggedUserId) {
        result.redirect("/login");
    }
    else{
    sql.query(`SELECT * FROM users WHERE afm='${req.session.loggedUserId}'`, (err, res) => {
        if (err) {
            console.log(err.message);
            result.redirect('/')
        }
        else {
            let details = res.rows[0];
            // console.log("Details1", details);
            // returnTo = req.originalUrl;
            // console.log('Details2', details);
            result.render('profile', {
                name: details.name, afm: details.afm, birthdate: details.birthdate, phone: details.phone, address: details.address, city: details.city, email: details.email,
                layout: req.session.loggedUserRole=='admin'? "main-admin" : "main-user"
            });
        }
    });

}})

app.get('/search', (req, result) => {
    // console.log(req)
    const searchTerm = req.query.term;
    // console.log(searchTerm);
    console.log('1');
    const query=`SELECT * FROM book JOIN writes on book.isbn=writes.isbn join users on writes.afm=users.afm WHERE title like '%${searchTerm}%'
                    OR normal_title like '%${searchTerm}%'
                    OR book.isbn like '%${searchTerm}%'
                    OR category like '%${searchTerm}%'
                    OR language like '%${searchTerm}%'
                    OR name like '%${searchTerm}%'`
    console.log(query)
    sql.query(query, (err, res) => {
        if (err) {
            console.log(err.message);
            result.redirect(returnTo);
        }
        else {
            console.log('2');
            // details = res.rows[0];
            console.log(res.rows);
            returnTo = req.originalUrl;
            // console.log('Details2', details);
            console.log('3');
            result.render('results', {
                books: res.rows,
                page_title: 'Αποτελέσματα Αναζήτησης',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole=='admin'? "main-admin" : "main-user") : "main"
            });
        }
    });

})



// app.get('/book/pros-ta-astra', (req, res) => {
//     console.log('GET / session=', req.session);
//     res.render('book');
// })

app.get("/category/:category", (req, result) => {
    console.log(req.params.category)
    sql.query(`SELECT * FROM book WHERE category='${req.params.category}'`, (err, res) => {
        if (err) {
            console.log(err.message);
            res.redirect(returnTo);
        }
        else {
            // details = res.rows[0];
            console.log(res.rows);
            returnTo = req.originalUrl;
            // console.log('Details2', details);
            result.render('category', {
                books: res.rows,
                page_title: req.params.category,
                layout: req.session.loggedUserId ? (req.session.loggedUserRole=='admin'? "main-admin" : "main-user") : "main"
            });
        }
    });
})