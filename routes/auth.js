/*************************************************************************************************
 * This file auth.js containsall the routes to manage the authentication apis. It handles requests
 * like registering user and login.
 *************************************************************************************************/

require('md5')
const express = require('express')
const md5 = require('md5')
const router=express.Router()
const {generateAccessToken,generateRefreshToken} =require('../JWT_Auth')

const refreshTokens = []
router.post('/token', (req,res) => {
    const { refreshToken } = req.body
    if(!refreshToken) return res.sendStatus(401)
    if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN, (err,email) => {
        if(err) return res.sendStatus(403)
        const accessToken = generateAccessToken({email:'email.email'})
        res.json({accessToken})
    })
})

/**
 * @swagger
 * components:
 *   requestBodies:
 *      User:
 *         content:
 *             'application/json':
 *         schema:
 *             $ref: '#/components/schemas/User'
 *   
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - phone_no
 *         - role_id
 *       properties:
 *         id:
 *           type: int
 *           description: The auto-generated id of the User
 *         name:
 *           type: string
 *           description: Name of User
 *         email:
 *           type: string
 *           description: email of User
 *         phone_no:
 *           type: int
 *           description: Phone number of User
 *         role_id:
 *           type: int
 *           description: Role id of 2 shows the user is doctor, 1 means admin and 0 means a patient 
 *       example:
 *         id: 3
 *         name: mark
 *         email: mark@doc.com
 *         phone_no: 923316745589
 *         role_id: 2
 *        
 */    



/**
  * @swagger
  * tags:
  *   name: Auth
  *   description: Login/Register managing Rest API
  */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                      type: string
 *                      description: name of user
 *                   email:
 *                      type: string
 *                      description: email of user
 *                   password:
 *                      type: string
 *                      description: Password of user
 *                   Phone_no:
 *                      type: integer
 *                      description: Phone number of user
 *                   role_id:
 *                      type: integer
 *                      description: Role Id of user 1 is Admin 2 is Doctor 3 is Patient
 *     responses:
 *       200:
 *         description: The User was successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *                 type: object
 *                 properties:
 *                   accessToken:
 *                      type: string
 *                      description: access token for authurization
 *       500:
 *         description: Some server error
 */

router.post('/register',(req,res) => {
    const {name, email, password, phone_no, role_id} = req.body

    req.app.knex('users').select('id').where({
        email
    }).first().then(user => {
        if(user) {
            res.status(409).send({error:"user already exists"})
        } else {
            console.log('working')
            req.app.knex('users').insert({
                name,
                email,
                password:md5(password),
                role_id,
                phone_no
            }).then((user) => {
                if(user) {
                    const accessToken = generateAccessToken({email:user.email})
                    const refreshToken = generateRefreshToken({email:user.email})
                    res.status(200).send({accessToken,refreshToken,user:{
                        id,name,email,role_id
                    }})
                } else {
                    res.status(500).send({error:'unable to register'})
                }
            })
        }
    })
})

/**
 * @swagger
 * /login:
 *   post:
 *     summary: login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                      type: string
 *                      description: email of user
 *                   password:
 *                      type: string
 *                      description: Password of user
 *     responses:
 *       200:
 *         description: The User was successfully loggedin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *                 type: object
 *                 properties:
 *                   accessToken:
 *                      type: string
 *                      description: access token for authurization
 *        
 *       500:
 *         description: Some server error
 */

router.post('/login',(req,res) => {
    const {email, password} = req.body
    req.app.knex('users').select('id','name','email','role_id').where({
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

module.exports=router