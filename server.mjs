import express from "express";
import { engine } from "express-handlebars";
import sql from './db.heroku-pg.js'
import { checkAuthenticated } from "./login.mjs";
import { convertDate } from "./date.mjs";
import Session from './setup-session.mjs'
const app = express()
import multer from 'multer'
import bcrypt from 'bcrypt'
let log = await import('./login.mjs')
import greekUtils from 'greek-utils';
import aws from 'aws-sdk';

aws.config.region = 'eu-central-1';
const S3_BUCKET = process.env.S3_BUCKET;


export let prosTaAstra = { title: "pros-ta-astra", normal_title: "Προς τ'άστρα" };

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `./user-data/uploads/`);
    },
    filename: (req, file, cb) => {
        cb(null, `${draftIndex}_${req.session.loggedUserId}_${file.fieldname}.pdf`);
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
let draftIndex = "" //Για την αρίθμηση αιτημάτων και το αντίστοιχο όνομα των αρχείων που ανεβαίνουν

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
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
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

    sql.query(`SELECT id FROM draft ORDER BY ID DESC LIMIT 1`, (err, res) => {
        draftIndex = parseInt(res.rows[0].id) + 1;
    })

    returnTo = req.originalUrl;
    if (checkAuthenticated(req) == false) {
        res.redirect("/login");
    }
    else {
        console.log("GET / session=", req.session);
        res.render("publish", { layout: req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user" });
    }
})

app.post("/upload", upload.fields([{ name: 'summary', maxCount: 1 }, { name: 'analysis', maxCount: 1 }, { name: 'chapter', maxCount: 1 }]), (req, result) => {
    let todaysDate = new Date();
    todaysDate = convertDate(todaysDate);
    console.log('1')
    const qry1 = {
        text: `INSERT INTO draft (id, title, category, words, comments, post_date) VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [draftIndex, req.body.title, req.body.category, req.body.wordsum, req.body.comments, todaysDate]
    }

    const qry2 = {
        text: `INSERT INTO suggests (afm, id) VALUES ($1, $2)`,
        values: [req.session.loggedUserId, draftIndex]
    }

    sql.query(qry1);

    sql.query(qry2, (err, res) => {
        draftIndex += 1;
        result.render("publish", { layout: "main-user", message: "Το ανέβασμα ολοκληρώθηκε" });
    })
    // console.log("GET / session=", req.session);
    // console.log(req)
})

app.get("/admin", (req, res) => {
    if (req.session.loggedUserRole == 'admin') {
        console.log("GET / session=", req.session);
        res.render("admin", { layout: "main-admin" });
    }
    else { res.redirect("/") }
})

app.get("/best-sellers", (req, result) => {
    sql.query(`SELECT * FROM book ORDER BY sales LIMIT 10`, (err, res) => {
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
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });
})

app.get("/latest", (req, result) => {
    sql.query(`SELECT * FROM book ORDER BY release_year DESC LIMIT 7`, (err, res) => {
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
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
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
    log.getUserByEmail(req.body.email, (err, user) => {
        console.log(req.body.email)
        if (user != undefined) {
            result.render('signup', { message: 'Υπάρχει ήδη χρήστης με αυτό το email' });
        }
    })

    log.getUserByAFM(req.body.afm, (err, user) => {
        console.log(req.body.email)
        if (user != undefined) {
            result.render('signup', { message: 'Υπάρχει ήδη χρήστης με αυτό το ΑΦΜ' });
        }
    })

    console.log(req.body)
    if (req.body.password != req.body.repeatPassword) {
        result.render('signup', { message: 'Οι κωδικοί πρόσβασης δεν ταιριάζουν' });
    }

    try {
        const psswd = await bcrypt.hash(req.body.password, 10);

        const query = {
            text: 'INSERT INTO users (afm, email, password, name, birthdate, phone, address, city) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            values: [req.body.afm, req.body.email, psswd, req.body.name, req.body.dob, req.body.tel, req.body.address, req.body.city]
        }

        sql.query(query, (err, res) => {
            if (err) {
                // console.log(err)
                result.render('signup', { message: 'Προέκυψε κάποιο πρόβλημα. Ελέγξτε τα στοιχεία σας και προσπαθήστε ξανά' });
            }
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


    log.getUserByEmail(req.body.email, (err, user) => {
        console.log(req.body.email)
        if (user == undefined) {
            result.render('login', { message: 'Δε βρέθηκε χρήστης με αυτό το email' });
        }
        else {
            const match = bcrypt.compare(req.body.password, user.password, (err, match) => {
                if (match) {
                    //Θέτουμε τη μεταβλητή συνεδρίας "loggedUserId"
                    req.session.loggedUserId = user.afm;
                    req.session.loggedUserRole = user.is_admin ? "admin" : "user";
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
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });

})

app.get('/profile', (req, result) => {
    returnTo = req.originalUrl;
    if (!req.session.loggedUserId) {
        result.redirect("/login");
    }
    else {
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
                    layout: req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user"
                });
            }
        });

    }
})

app.get('/search', (req, result) => {
    // console.log(req)
    const searchTerm = req.query.term;
    // console.log(searchTerm);
    console.log('1');
    const query = `SELECT * FROM book JOIN writes on book.isbn=writes.isbn join users on writes.afm=users.afm WHERE title like '%${searchTerm}%'
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
            // console.log('2');
            // details = res.rows[0];
            // console.log(res.rows);
            returnTo = req.originalUrl;
            // console.log('Details2', details);
            // console.log('3');
            result.render('results', {
                books: res.rows,
                page_title: 'Αποτελέσματα Αναζήτησης',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });

})


//Χρειάζεται προσοχή στα κεφαλαία και στα μικρά γράμματα
app.post('/results', (req, result) => {
    // console.log(req)
    // const searchTerm = req.query.term;
    // console.log(searchTerm);
    // console.log('1');
    console.log(req.body.bookisbn);
    let q1=req.body.booktitle==""? "": ` WHERE title like '%${req.body.booktitle}%'`;
    let q2=req.body.booktitle==""? "": (q1==""? ` WHERE normal_title like '%${req.body.booktitle}%'`: ` OR normal_title like '%${req.body.booktitle}%'`)
    let q3=req.body.bookisbn==""? "": (q1+q2==""? ` WHERE book.isbn like '%${req.body.bookisbn}%'`: ` OR book.isbn like '%${req.body.bookisbn}%'`)
    let q4=req.body.bookcategory==""? "": (q1+q2+q3==""? ` WHERE category like '%${req.body.bookcategory}%'`: ` OR category like '%${req.body.bookcategory}%'`)
    let q5=req.body.bookyear==""? "": (q1+q4+q2+q3==""? ` WHERE release_year=${req.body.bookyear}`: ` OR language=${req.body.booklanguage}`)
    let q6=req.body.bookauthor==""? "": (q1+q5+q4+q2+q3==""? ` WHERE name like '%${req.body.bookauthor}%'`: ` OR author like '%${req.body.bookauthor}%'`)
    // let q0=q1+q2+q3+q4+q5+q6==""? "": " WHERE "
    const query = `SELECT * FROM book JOIN writes on book.isbn=writes.isbn join users on writes.afm=users.afm${q1}${q2}${q3}${q4}${q5}${q6}`

    // console.log(query)
    sql.query(query, (err, res) => {
        console.log(query);
        if (err) {
            console.log(err.message);
            result.redirect(returnTo);
        }
        else {
            // console.log('2');
            // details = res.rows[0];
            // console.log(res.rows);
            // returnTo = req.originalUrl;
            // console.log('Details2', details);
            // console.log('3');
            result.render('results', {
                books: res.rows,
                page_title: 'Αποτελέσματα Αναζήτησης',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });

})


// app.get('/book/pros-ta-astra', (req, res) => {
//     console.log('GET / session=', req.session);
//     res.render('book');
// })

app.get("/category/:category", (req, result) => {
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
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });
})

app.get("/add-book", (req, res) => {
    if (req.session.loggedUserRole == 'admin') {
        console.log("GET / session=", req.session);
        res.render("add-book", { layout: "main-admin" });
    }
    else { res.redirect("/") }
})

app.post("/add-book", (req, result) => {
    let aafm = "" //author afm
    log.getBookByISBN(req.body.isbn, (err, user) => {
        // console.log(req.body.email)
        if (user != undefined) {
            result.render('add-book', { message: 'Υπάρχει ήδη βιβλίο με αυτό το ISBN' });
        }
    })

    log.getUserByName(req.body.author, (err, user) => {
        if (user == undefined) {
            result.render('add-book', { message: 'Δεν υπάρχει συγγραφέας με αυτό το όνομα' });
        }
        else {
            aafm = user.afm

            let title = (greekUtils.toGreeklish(req.body.normal_title)).toLowerCase();
            title = title.replace(/\s+/g, '-')
            // console.log(aafm);
            const query1 = {
                text: 'INSERT INTO book (title, pages, normal_title, description, isbn, price, category, release_year, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                values: [title, req.body.pages, req.body.normal_title, req.body.description, req.body.isbn, req.body.price, req.body.category, req.body.release_year, req.body.language]
            }

            const query2 = {
                text: 'INSERT INTO writes (isbn, afm) VALUES ($1, $2)',
                values: [req.body.isbn, aafm]
            }

            sql.query(query1, (err, res) => {
                if (err) {
                    console.log(err)
                    result.render('add-book', { message: 'Προέκυψε κάποιο πρόβλημα. Ελέγξτε τα στοιχεία σας και προσπαθήστε ξανά' });
                }
                else {
                    sql.query(query2);
                    result.render('add-book', { success: 'Επιτυχής προσθήκη!' });
                }
            })
        }
    })

})

app.get('/up', (req, res) => {
    const s3 = new aws.S3();
    // const fileName = req.query['file-name'];
    // const fileType = req.query['file-type'];
    const fileName = 'up_logo';
    const fileType = '.jpg';
    const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.end();
        }
        const returnData = {
            signedRequest: data,
            url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
        };
        res.write(JSON.stringify(returnData));
        res.end();
    });
});