import bcrypt from 'bcrypt'
import sql from './db.heroku-pg.js'
// import dotenv from 'dotenv'
// if (process.env.NODE_ENV !== 'production') {
//     dotenv.config();
// }

let userModel;
// userModel = await import(`../model/${process.env.MODEL}/task-list-model-${process.env.MODEL}.mjs`)


export let showLogInForm = function (req, res) {
    popupForm();
}

export let showRegisterForm = function (req, res) {
    res.render('register-password', {});
}

export let doRegister = function (req, res) {
    userModel.registerUser(req.body.username, req.body.password, (err, result, message) => {
        if (err) {
            console.error('registration error: ' + err);
            //FIXME: δε θα έπρεπε να περνάμε το εσωτερικό σφάλμα στον χρήστη
            res.render('register-password', { message: err });
        }
        else if (message) {
            res.render('register-password', message)
        }
        else {
            res.redirect('/login');
        }
    })
}

export let doLogin = function (req, res) {
    //Ελέγχει αν το username και το password είναι σωστά και εκτελεί την
    //συνάρτηση επιστροφής authenticated

    userModel.getUserByUsername(req.body.username, (err, user) => {
        if (user == undefined) {
            res.render('login-password', { message: 'Δε βρέθηκε αυτός ο χρήστης' });
        }
        else {
            const match = bcrypt.compare(req.body.password, user.password, (err, match) => {
                if (match) {
                    //Θέτουμε τη μεταβλητή συνεδρίας "loggedUserId"
                    req.session.loggedUserId = user.id;
                    //Αν έχει τιμή η μεταβλητή req.session.originalUrl, αλλιώς όρισέ τη σε "/" 
                    const redirectTo = req.session.originalUrl || "/tasks";
                    // res.redirect("/");
                    res.redirect(redirectTo);
                }
                else {
                    res.render("login", { message: 'Ο κωδικός πρόσβασης είναι λάθος' })
                }
            })
        }
    })
}

export let doLogout = (req, res) => {
    //Σημειώνουμε πως ο χρήστης δεν είναι πια συνδεδεμένος
    req.session.destroy();
    res.redirect('/');
}
export let tasks = { "id": 1, "task": "Να βρω σφάλματα", "status": 0, "created_at": "2022-05-07 09:08:10" };
//Τη χρησιμοποιούμε για να ανακατευθύνουμε στη σελίδα /login όλα τα αιτήματα από μη συνδεδεμένους χρήστες
export let checkAuthenticated = function (req, res, next) {
    // console.log('test')
    // console.log(req);
    // //Αν η μεταβλητή συνεδρίας έχει τεθεί, τότε ο χρήστης είναι συνεδεμένος
    if (req.session.loggedUserId) {
        return true;}
    //     console.log("user is authenticated", req.originalUrl);
    //     //Καλεί τον επόμενο χειριστή (handler) του αιτήματος
    //     next();
    // }
    else {
    //     //Ο χρήστης δεν έχει ταυτοποιηθεί, αν απλά ζητάει το /login ή το register δίνουμε τον
    //     //έλεγχο στο επόμενο middleware που έχει οριστεί στον router
    //     if ((req.originalUrl === "/login") || (req.originalUrl === "/register")) {
    //         next()
    //     }
    //     else {
            //Στείλε το χρήστη στη "/login" 
            console.log("not authenticated, redirecting to /login")
            return false;
            // res.redirect('/login');
        // }
    }
}

export let getUserByEmail = (email, callback) => {
    const query = {
        text: `SELECT afm, password FROM users WHERE email=$1`,
        values: [email],
    }

    sql.query(query, (err, res) => {
        if (err) {
            console.log(err.stack)
            callback(err.stack)
        }
        else {
            callback(null, res.rows[0])
        }
    })
}