import express from "express";
import { engine } from "express-handlebars";
import sql from './db.heroku-pg.js'
import { convertDate } from "./date.mjs";
import Session from './setup-session.mjs'
const app = express()
import multer from 'multer'
import bcrypt from 'bcrypt'
let db = await import('./database-checks.mjs')
import greekUtils from 'greek-utils';

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
const multer1 = multer();

app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', '.hbs');
app.use(express.static('public/'));
app.use(Session);
app.use(express.urlencoded({ extended: true }));


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
            returnTo = req.originalUrl;
            result.render('index', {
                books: res.rows,
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });
})


app.get("/add-book", (req, res) => {
    if (req.session.loggedUserRole == 'admin') {
        res.render("add-book", { layout: "main-admin" });
    }
    else { res.redirect("/") }
})

app.get("/admin", (req, result) => {
    if (req.session.loggedUserRole == 'admin') {
        sql.query(`SELECT * FROM draft JOIN suggests on draft.id=suggests.id JOIN users on users.afm=suggests.afm`, (err, res) => {
            if (err) {
                console.log(err.message);
            }
            else {
                returnTo = req.originalUrl;
                result.render('admin', {
                    drafts: res.rows,
                    layout: "main-admin"
                });
            }
        });
    }
    else { result.redirect("/") }
})



app.get("/best-sellers", (req, result) => {
    sql.query(`SELECT * FROM book ORDER BY sales LIMIT 10`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            returnTo = req.originalUrl;
            result.render('best-sellers', {
                books: res.rows,
                page_title: 'Best Sellers',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });
})


app.get('/book/:title', (req, result) => {
    let details = {};
    sql.query(`SELECT * FROM book JOIN writes on book.isbn=writes.isbn join users on writes.afm=users.afm WHERE title='${req.params.title}'`, (err, res) => {
        if (err) {
            result.redirect('/')
        }
        else {
            details = res.rows[0];
            returnTo = req.originalUrl;
            result.render('book', {
                title: details.title, pages: details.pages, author: details.name, normal_title: details.normal_title, description: details.description, isbn: details.isbn, price: details.price, category: details.category, release_year: details.release_year, language: details.language,
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });

})

app.get("/category/:category", (req, result) => {
    sql.query(`SELECT * FROM book WHERE category='${req.params.category}'`, (err, res) => {
        if (err) {
            res.redirect(returnTo);
        }
        else {
            returnTo = req.originalUrl;
            result.render('category', {
                books: res.rows,
                page_title: req.params.category,
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });
})

app.get('/drafts/:id', (req, result) => {
    if (!req.session.loggedUserId) {
        result.redirect("/");
    }

    if (req.session.loggedUserRole != 'admin') {
        db.getAFMFromDraftID(req.params.id, (err, user) => {
            if (user.afm != req.session.loggedUserId) {
                result.redirect("/");
            }
        })
    }

    returnTo = req.originalUrl;
    sql.query(`SELECT * FROM draft JOIN suggests on draft.id=suggests.id JOIN users on users.afm=suggests.afm WHERE draft.id='${req.params.id}'`, (err, res) => {
        if (err) {
            result.redirect('/')
        }
        else {
            let details = res.rows[0];
            result.render('drafts', {
                id: req.params.id, name: details.name, title: details.title, category: details.category, words: details.words, comments: details.comments, adminComments: details.admin_comments, isAccepted: details.is_approved, isReviewed: details.is_reviewed, admin: (req.session.loggedUserRole == 'admin'),
                layout: req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user"
            });
        }
    });


})

app.get('/editprofile/:afm', (req, result) => {
    returnTo = req.originalUrl;
    if (req.session.loggedUserRole != 'admin') {
        result.redirect("/");
    }
    else {
        sql.query(`SELECT * FROM users WHERE afm='${req.params.afm}'`, (err, res) => {
            if (err) {
                result.redirect('/')
            }
            else {
                let details = res.rows[0];
                result.render('editprofile', {
                    name: details.name, afm: details.afm, birthdate: details.birthdate, phone: details.phone, address: details.address, city: details.city, email: details.email, message: req.query.message, error: req.query.error,
                    layout: 'main-admin'
                });
            }
        });

    }
})


app.get("/latest", (req, result) => {
    sql.query(`SELECT * FROM book ORDER BY release_year DESC LIMIT 7`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            returnTo = req.originalUrl;
            result.render('latest', {
                books: res.rows,
                page_title: 'Νέες κυκλοφορίες',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });
})

app.get("/listallusers", (req, result) => {
    if (req.session.loggedUserRole != 'admin') {
        result.redirect('/');
    }
    sql.query(`SELECT name,afm FROM users ORDER BY name ASC`, (err, res) => {
        if (err) {
            console.log(err.message);
        }
        else {
            // returnTo = req.originalUrl;
            result.render('listallusers', {
                user: res.rows,
                layout: "main-admin"
            });
        }
    })
})

app.get("/login", (req, res) => {
    if (req.session.loggedUserId) {
        res.redirect('/');
    }
    res.render("login");
})


app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect(returnTo);
})


app.get("/mydrafts", (req, result) => {
    if (req.session.loggedUserRole == 'user') {
        sql.query(`SELECT * FROM draft JOIN suggests on draft.id=suggests.id WHERE suggests.afm='${req.session.loggedUserId}'`, (err, res) => {
            if (err) {
                console.log(err.message);
            }
            else {
                returnTo = req.originalUrl;
                result.render('mydrafts', {
                    drafts: res.rows,
                    layout: "main-user"
                });
            }
        });
    }
    else { result.redirect("login") }
})


app.get('/profile', (req, result) => {
    returnTo = req.originalUrl;
    if (!req.session.loggedUserId) {
        result.redirect("/login");
    }
    else {
        sql.query(`SELECT * FROM users WHERE afm='${req.session.loggedUserId}'`, (err, res) => {
            if (err) {
                result.redirect('/')
            }
            else {
                let details = res.rows[0];
                result.render('profile', {
                    name: details.name, afm: details.afm, birthdate: details.birthdate, phone: details.phone, address: details.address, city: details.city, email: details.email, admin: (req.session.loggedUserRole == 'admin'),
                    layout: req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user"
                });
            }
        });

    }
})

app.get("/publish", (req, res) => {

    sql.query(`SELECT id FROM draft ORDER BY ID DESC LIMIT 1`, (err, res) => {
        draftIndex = parseInt(res.rows[0].id) + 1;
    })

    returnTo = req.originalUrl;
    if (!req.session.loggedUserId) {
        res.redirect("/login");
    }
    else {
        res.render("publish", { layout: req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user" });
    }
})


app.get("/review/:id", (req, result) => {

    if (req.session.loggedUserRole != 'admin') {
        result.redirect("/")
    }
    else {
        let action = req.query.edit;
        if (action == 'approve') {
            sql.query(`UPDATE draft SET is_reviewed=true, is_approved=true, admin_comments='${req.query.admincomments}' WHERE id='${req.params.id}'`, (err, res) => {
                if (err) {
                    result.redirect('/');
                }
                else {
                    result.redirect(returnTo);
                }
            });
        }

        if (action == 'reject') {
            sql.query(`UPDATE draft SET is_reviewed=true, is_approved=false, admin_comments='${req.query.admincomments}' WHERE id='${req.params.id}'`, (err, res) => {
                if (err) {
                    result.redirect('/');
                }
                else {
                    result.redirect(returnTo);
                }
            });
        }

        if (action == 'delete') {
            sql.query(`DELETE FROM suggests WHERE id='${req.params.id}'`);
            sql.query(`DELETE FROM draft WHERE id='${req.params.id}'`, (err, res) => {
                if (err) {
                    result.redirect(returnTo);
                }
                else {
                    result.redirect('/admin');
                }
            });
        }
    }
})


app.get('/search', (req, result) => {

    const searchTerm = req.query.term;
    const query = `SELECT * FROM book JOIN writes on book.isbn=writes.isbn join users on writes.afm=users.afm WHERE title like '%${searchTerm}%'
                    OR normal_title like '%${searchTerm}%'
                    OR book.isbn like '%${searchTerm}%'
                    OR category like '%${searchTerm}%'
                    OR language like '%${searchTerm}%'
                    OR name like '%${searchTerm}%'`
    sql.query(query, (err, res) => {
        if (err) {
            result.redirect(returnTo);
        }
        else {
            returnTo = req.originalUrl;
            result.render('results', {
                books: res.rows,
                page_title: 'Αποτελέσματα Αναζήτησης',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });

})


app.get("/signup", (req, res) => {
    res.render("signup");
})


app.post("/add-book", multer1.none(), (req, result) => {
    console.log(req.body.book.cover_url);
    let aafm = "" //author afm
    db.getBookByISBN(req.body.isbn, (err, user) => {
        if (user != undefined) {
            result.render('add-book', { message: 'Υπάρχει ήδη βιβλίο με αυτό το ISBN' });
            console.log('test1');
        }
    })

    db.getUserByName(req.body.author, (err, user) => {
        if (user == undefined) {
            result.render('add-book', { message: 'Δεν υπάρχει συγγραφέας με αυτό το όνομα' });
            console.log('test2');

        }
        else {
            aafm = user.afm
            console.log('Going to insert\n\n\n\n');
            let title = (greekUtils.toGreeklish(req.body.normal_title)).toLowerCase();
            title = title.replace(/\s+/g, '-')
            const query1 = {
                text: 'INSERT INTO book (title, pages, normal_title, description, isbn, price, category, release_year, language, cover) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                values: [title, req.body.pages, req.body.normal_title, req.body.description, req.body.isbn, req.body.price, req.body.category, req.body.release_year, req.body.language, req.body.book.cover_url]
            }

            const query2 = {
                text: 'INSERT INTO writes (isbn, afm) VALUES ($1, $2)',
                values: [req.body.isbn, aafm]
            }

            console.log('Inserted values\n\n\n\n');
            sql.query(query1, (err, res) => {
                if (err) {
                    result.render('add-book', { message: 'Προέκυψε κάποιο πρόβλημα. Ελέγξτε τα στοιχεία σας και προσπαθήστε ξανά' });
                    console.log('test3');
                }
                else {
                    sql.query(query2);
                    result.render('add-book', { success: 'Επιτυχής προσθήκη!' });
                    console.log('test4');
                }
            })
        }
    })

})

app.post('/auth', (req, result) => {


    db.getUserByEmail(req.body.email, (err, user) => {
        if (user == undefined) {
            result.render('login', { message: 'Δε βρέθηκε χρήστης με αυτό το email' });
        }
        else {
            const match = bcrypt.compare(req.body.password, user.password, (err, match) => {
                if (match) {
                    req.session.loggedUserId = user.afm;
                    req.session.loggedUserRole = user.is_admin ? "admin" : "user";
                    result.redirect(returnTo);
                }
                else {
                    result.render("login", { message: 'Ο κωδικός πρόσβασης είναι λάθος' })
                }
            })
        }
    })
})


app.post("/register", async (req, result) => {
    db.getUserByEmail(req.body.email, (err, user) => {
        if (user != undefined) {
            result.render('signup', { message: 'Υπάρχει ήδη χρήστης με αυτό το email' });
        }
    })

    db.getUserByAFM(req.body.afm, (err, user) => {
        if (user != undefined) {
            result.render('signup', { message: 'Υπάρχει ήδη χρήστης με αυτό το ΑΦΜ' });
        }
    })


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
                result.render('signup', { message: 'Προέκυψε κάποιο πρόβλημα. Ελέγξτε τα στοιχεία σας και προσπαθήστε ξανά' });
            }
            else {
                result.render('signup', { success: 'Επιτυχής εγγραφή!' });
            }
        })
    } catch (err) {
        result.render('signup', { message: 'Προέκυψε κάποιο πρόβλημα. Ελέγξτε τα στοιχεία σας και προσπαθήστε ξανά' });
    }
})


//Χρειάζεται προσοχή στα κεφαλαία και στα μικρά γράμματα
app.post('/results', (req, result) => {
    let q1 = req.body.booktitle == "" ? "" : ` WHERE title like '%${req.body.booktitle}%'`;
    let q2 = req.body.booktitle == "" ? "" : (q1 == "" ? ` WHERE normal_title like '%${req.body.booktitle}%'` : ` OR normal_title like '%${req.body.booktitle}%'`)
    let q3 = req.body.bookisbn == "" ? "" : (q1 + q2 == "" ? ` WHERE book.isbn like '%${req.body.bookisbn}%'` : ` OR book.isbn like '%${req.body.bookisbn}%'`)
    let q4 = req.body.bookcategory == "" ? "" : (q1 + q2 + q3 == "" ? ` WHERE category like '%${req.body.bookcategory}%'` : ` OR category like '%${req.body.bookcategory}%'`)
    let q5 = req.body.bookyear == "" ? "" : (q1 + q4 + q2 + q3 == "" ? ` WHERE release_year=${req.body.bookyear}` : ` OR language=${req.body.booklanguage}`)
    let q6 = req.body.bookauthor == "" ? "" : (q1 + q5 + q4 + q2 + q3 == "" ? ` WHERE name like '%${req.body.bookauthor}%'` : ` OR author like '%${req.body.bookauthor}%'`)
    const query = `SELECT * FROM book JOIN writes on book.isbn=writes.isbn join users on writes.afm=users.afm${q1}${q2}${q3}${q4}${q5}${q6}`

    sql.query(query, (err, res) => {
        if (err) {
            result.redirect(returnTo);
        }
        else {
            result.render('results', {
                books: res.rows,
                page_title: 'Αποτελέσματα Αναζήτησης',
                layout: req.session.loggedUserId ? (req.session.loggedUserRole == 'admin' ? "main-admin" : "main-user") : "main"
            });
        }
    });

})


app.post("/updateprofile/:afm", (req, result) => {



    if (req.session.loggedUserRole != 'admin') {
        result.redirect('/');
    }

    const query = {
        text: `UPDATE users SET name=$1, phone=$2, address=$3, city=$4, email=$5 WHERE afm='${req.params.afm}'`,
        values: [req.body.name, req.body.phone, req.body.address, req.body.city, req.body.email]
    }

    sql.query(query, (err, res) => {
        if (err) {
            result.redirect("/editprofile/" + req.params.afm + "/?error=err");
        }
        else {
            result.redirect("/editprofile/" + req.params.afm + "/?message=success");
        }
    })

})



app.post("/upload", upload.fields([{ name: 'summary', maxCount: 1 }, { name: 'analysis', maxCount: 1 }, { name: 'chapter', maxCount: 1 }]), (req, result) => {
    let todaysDate = new Date();
    todaysDate = convertDate(todaysDate);
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
})