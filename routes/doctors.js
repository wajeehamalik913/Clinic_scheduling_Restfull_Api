/*************************************************************************************************
 * This file doctors.js contains all the routes to manage the doctors apis. It handles requests
 * like view all doctors, specific doctors, slots of doctors, their availibility and doctors with 
 * most appointments and 6+ hours.
 *************************************************************************************************/

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
 * /doctors/{doctor_id}/slots:
 *   get:
 *     summary: Get the all available s;lots of doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The doctor id
 *     responses:
 *       200:
 *         description: all slots available found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: integer
 */

router.get('/:doctor_id/slots',authenticateToken,(req,res)=>{
    const { doctor_id } = req.params
    req.app.knex('appointments').select().where({
        doctor_id
    }).then((appointments) => {
        let availableSlots=[];
        let i=0;
        let x=0;
        let bookedSlots=[]
        let index = 0;
        while(appointments[index]) {
            for(i=appointments[index].slot_id;i<=appointments[index].slot_id+appointments[index].total_slots-1;i++){
                bookedSlots[x]=i
                x++;
            }
            index++
        }
        let y=0;
        let slots=1
        for(let w=0;w<bookedSlots.length;w++){
            for(slots ;slots<=32;slots++){
                console.log(slots)
                if(slots===bookedSlots[w]){
                    console.log(bookedSlots[w],'======',slots)
                    slots++
                    break;
                }
                else{
                    availableSlots[y]=slots
                    y++
                }
                  
            }
            
        }
        for(slots ;slots<=32;slots++){
            availableSlots[y]=slots
                    y++
        }
        return res.status(200).send({availableSlots})
        
    })
})


/**
 * @swagger
 * /doctors/availability:
 *   get:
 *     summary: Get the available Doctors 
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: available doctors found
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   name:
 *                      type: string
 *                      description: name of doctor with 6+ hours
 *                   email:
 *                      type: string
 *                      description: email of doctor
 *                   Phone_no:
 *                      type: int
 *                      description: Phone number of available doctors
 *                   slots_available:
 *                      type: int 
 *                      description: Number of slots avialable
 *       404:
 *         description: No doctor is available
 */


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
/**
 * @swagger
 * /doctors/mostAppointments:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get the Doctor who has maximum appointments 
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: The doctors with maximum hours found
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   max_appointments:
 *                      type: int
 *                      description: maximum number of appointments
 *                   doctor_id:
 *                      type: int
 *                      description: Id of doctor
 *                   name:
 *                      type: string
 *                      description: Name of doctor
 *           
 */

router.get('/mostAppointments',authenticateToken,(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 1) {
            let date = new Date();
            date = date.getFullYear()+'-'+("0" + (date.getMonth() + 1)).slice(-2)+'-'+("0" + date.getDate()).slice(-2)
            req.app.knex('doctor_schedule').where({
                date
            }).max('total_appointments as Maximum_appointments').column('doctor_id').join('users','users.id','=','doctor_schedule.doctor_id')
            .select('users.name').then((schedule) => {
                return res.status(200).send(schedule)
            })
        }
        else{
            return res.sendStatus(400)  
        }
    })
})

/**
 * @swagger
 * /doctors/minHours:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get the Doctor who has appointments min 6h and more
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: The doctors with 6+ hours found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                      type: string
 *                      description: name of doctor with 6+ hours
 *                   id:
 *                      type: int
 *                      description: Id of doctor
 *                   slots_booked:
 *                      type: int
 *                      description: Number of slots booked
 *                   booked_hours:
 *                      type: string
 *                      description: Hours tthats booked
 *                   
 *       404:
 *         description: No doctors have more than 6 hours appointments
 *           
 */

router.get('/minHours',authenticateToken,(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 1) {
            let date = new Date();
            date = date.getFullYear()+'-'+("0" + (date.getMonth() + 1)).slice(-2)+'-'+("0" + date.getDate()).slice(-2)
            req.app.knex('doctor_schedule').where({
                
            }).andWhere('slots_booked','>',23).join('users','users.id','=','doctor_schedule.doctor_id')
            .select('users.name','users.id','doctor_schedule.slots_booked').then((doctors) => {
                if(!doctors){
                    return res.status(404).send({error:"No doctors have more than 6 hours appointments"})
                }
                for (let index = 0; index < doctors.length; index++) {
                    doctors[index].booked_hours = Math.trunc(doctors[index].slots_booked/4)+':'+(doctors[index].slots_booked%4)*15
                }
                return res.status(200).send(doctors)
            })
        }
        else{
            return res.sendStatus(400)   
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
            return res.sendStatus(404)
        }
        return res.status(200).send(data?data:{})
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
        return res.status(200).send(data?data:[])
    })
})


module.exports=router;
