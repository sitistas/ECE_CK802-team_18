import sql from './db.heroku-pg.js'

export let getUserByEmail = (email, callback) => {
    const query = {
        text: `SELECT afm, password, is_admin FROM users WHERE email=$1`,
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

export let getUserByAFM = (afm, callback) => {
    const query = {
        text: `SELECT email FROM users WHERE afm=$1`,
        values: [afm],
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

export let getBookByISBN = (isbn, callback) => {
    const query = {
        text: `SELECT isbn FROM book WHERE isbn=$1`,
        values: [isbn],
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

export let getUserByName = (name, callback) => {
    const query = {
        text: `SELECT afm FROM users WHERE name=$1`,
        values: [name],
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

export let getAFMFromDraftID = (id, callback) => {
    const query = {
        text: `SELECT afm FROM suggests WHERE id=$1`,
        values: [id],
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