const express = require('express')

const {authenticateToken}= require('../JWT_Auth')

const router=express.Router()

/**
 * @swagger
 * components:
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
 */

/**
  * @swagger
  * tags:
  *   name: Doctors
  *   description: Doctors managing Rest API
  */

/**
  * @swagger
  * tags:
  *   name: Appointments
  *   description: Appointments managing Rest API
  */

router.get('/:doctor_id/slots',(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 3) {

        }
    })
})
router.get('/availibility',authenticateToken,(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 2) {
            res.sendStatus(403)
        } else {
            let date = new Date();
            date = date.getFullYear()+'-'+("0" + (date.getMonth() + 1)).slice(-2)+'-'+("0" + date.getDate()).slice(-2)
            req.app.knex('users').where({
                role_id:2
            }).leftJoin('doctor_schedule',function() {
                this.on('users.id','=','doctor_schedule.doctor_id')
                .onVal('doctor_schedule.date','=',date)
            })
            .select('users.id','users.name','users.email','users.phone_no','doctor_schedule.doctor_id','doctor_schedule.slots_available','doctor_schedule.total_appointments')
            .then(doctors => {
                let filtered = []
                doctors.forEach((doctor) => {
                    if(doctor.doctor_id == null || (doctor.slots_available > 0 && doctor.total_appointments < 12)) {
                        filtered.push({
                            name:doctor.name,
                            email:doctor.email,
                            phone_no:doctor.phone_no,
                            slots_available:doctor.slots_available?doctor.slots_available:32,
                        })
                    } else if(role_id == 1) {
                        filtered.push({
                            name:doctor.name,
                            email:doctor.email,
                            phone_no:doctor.phone_no,
                            slots_available:doctor.slots_available,
                        })
                    }
                })
                res.status(200).send({doctors:filtered})
            })
                }
            })
})
router.get('/mostAppointments',(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 1) {
            let date = new Date();
            date = date.getFullYear()+'-'+("0" + (date.getMonth() + 1)).slice(-2)+'-'+("0" + date.getDate()).slice(-2)
            req.app.knex('doctor_schedule').where({
                date
            }).max('total_appointments as total_appointments').column('doctor_id').join('users','users.id','=','doctor_schedule.doctor_id')
            .select('users.name').then((schedule) => {
                res.status(200).send(schedule)
            })
        }
    })
})

router.get('/minHours',(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 1) {
            let date = new Date();
            date = date.getFullYear()+'-'+("0" + (date.getMonth() + 1)).slice(-2)+'-'+("0" + date.getDate()).slice(-2)
            req.app.knex('doctor_schedule').where({
                date
            }).andWhere('slots_booked','>',23).join('users','users.id','=','doctor_schedule.doctor_id')
            .select('users.name','users.id','doctor_schedule.slots_booked').then((doctors) => {
                for (let index = 0; index < doctors.length; index++) {
                    doctors[index].booked_hours = Math.trunc(doctors[index].slots_booked/4)+':'+(doctors[index].slots_booked%4)*15
                }
                res.status(200).send(doctors)
            })
        }
    })
})

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Get the Doctor by id
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The doctor id
 *     responses:
 *       200:
 *         description: The doctor found by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: The doctor was not found
 */

 router.get('/:id',authenticateToken, (req,res) => {
    const { id } = req.params
    req.app.knex('users').select('id','name','email','phone_no','role_id').where({
        role_id:2,
        id
    }).first().then(data => {
        if(!data){
            res.sendStatus(404)
        }
        res.status(200).send(data?data:{})
    })
})

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Returns the list of all the doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: The list of the doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
 router.get('/',authenticateToken,(req,res) => {
    req.app.knex('users').select('id','name','email','phone_no','role_id').where({
        role_id:2
    }).then(data => {
        res.status(200).send(data?data:[])
    })
})


module.exports=router;
