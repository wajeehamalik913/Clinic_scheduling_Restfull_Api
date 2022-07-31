require('dotenv').config()
require('md5')
const express = require('express')
const app = express()
const PORT = 8080

const jwt = require('jsonwebtoken')
const md5 = require('md5')
app.use(express.json())

const knex = require('knex')({
    client: 'mysql2',
    connection: {
      host : 'localhost',
      port : 3306,
      user : 'root',
      password : '',
      database : 'clinic_scheduling_db'
    }
  });

const authenticateToken = (req,res,next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(!token) return res.sendStatus(401)
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,email) => {
        if(err) return res.sendStatus(403)
        res.authenticatedEmail = email
        next()
    })
}

const generateAccessToken = email => {
    return jwt.sign(email,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'10m'})
}

const generateRefreshToken = email => {
    return jwt.sign(email,process.env.REFRESH_TOKEN)
}

const refreshTokens = []
app.post('/token', (req,res) => {
    const { refreshToken } = req.body
    if(!refreshToken) return res.sendStatus(401)
    if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN, (err,email) => {
        if(err) return res.sendStatus(403)
        const accessToken = generateAccessToken({email:'email.email'})
        res.json({accessToken})
    })
})

app.post('/register',(req,res) => {
    const {name, email, password, phone_no, role_id} = req.body

    knex('users').select('id').where({
        email
    }).first().then(user => {
        if(user) {
            res.status(409).send({error:"user already exists"})
        } else {
            console.log('working')
            knex('users').insert({
                name,
                email,
                password:md5(password),
                role_id,
                phone_no
            },['id','name','email','role_id']).then((user) => {
                if(user) {
                    const accessToken = generateAccessToken({email:user.email})
                    const refreshToken = generateRefreshToken({email:user.email})
                    res.status(200).send({accessToken,refreshToken,user,message:"successfully registered"})
                } else {
                    res.status(500).send({error:'unable to register'})
                }
            })
        }
    })
})

app.post('/login',(req,res) => {
    const {email, password} = req.body
    knex('users').select('id','name','email','role_id').where({
        email,
        password:md5(password)
    }).first().then(user => {
        if(user) {
            res.status(200).send({accessToken:generateAccessToken({email:user.email}),user})
        } else {
            res.status(401).send({error:"authentication failed"})
        }
    })
})

app.get('/doctors', authenticateToken, (req,res) => {
    knex('users').select('id','name','email','phone_no','role_id').where({
        role_id:2
    }).then(data => {
        res.status(200).send(data?data:[])
    })
})

app.get('/doctors/:id', authenticateToken, (req,res) => {
    const { id } = req.params
    knex('users').select('id','name','email','phone_no','role_id').where({
        role_id:2,
        id
    }).first().then(data => {
        res.status(200).send(data?data:{})
    })
})

app.listen(PORT, () => {
    console.log('this is good foe now')
})