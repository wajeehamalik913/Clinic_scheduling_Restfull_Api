/*************************************************************************************************
 * This file appointment.js containsall the routes to manage the apppointments apis. It handles 
 * requests like booking, details, cancel, patient history.
 *************************************************************************************************/

const express = require('express')
const {authenticateToken}= require('../JWT_Auth')
const router=express.Router()
/**
 * @swagger
 * components:
 *   schemas:
 *     appointmnent:
 *       type: object
 *       required:
 *         - id
 *         - pateint_id
 *         - doctor_id
 *         - slot_id
 *         - total_slots
 *         - appointment_date
 *         - booking date
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the appointment
 *         patient_id:
 *           type: integer
 *           description: patient Id
 *         doctor_id:
 *           type: integer
 *           description: doctor Id
 *         slot_id:
 *           type: integer
 *           description: slot id of starting slots to be booked
 *         total_slots:
 *           type: integer
 *           description: total number of slots to be booked in range [1-8] 
 *         appointment_date:
 *           type: Date
 *           description: date for which appointment is booked 
 *         booking_date:
 *           type: Date
 *           description: date at which the appointment is booked 
 *         status:
 *           type: string
 *           description: if the appointment is canceled then it shows cancelled else booked 
 *         example:
 *           id: 1
 *           pateint_id: 2
 *           doctor_id: 1
 *           slot_id: 3
 *           total_slots: 5
 *           appointment_date: 2022-08-06
 *           booking date: 2022-08-04
 *           status: booked
 */

/**
  * @swagger
  * tags:
  *   name: Appointments
  *   description: Appointments managing Rest API
  */

/**
 * @swagger
 * /appointments/book:
 *   post:
 *     summary: Book an appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   patient_id:
 *                      type: integer
 *                      description: Id of patient
 *                   doctor_id:
 *                      type: integer
 *                      description: Id of doctor
 *                   slot_id:
 *                      type: integer
 *                      description: Id of slots starting to be  booked
 *                   total_slots:
 *                      type: integer
 *                      description: total number of slots to be booked
 *                   appointment_date:
 *                      type: Date
 *                      description: date for which appointment is to be booked
 *     responses:
 *       200:
 *         description: The patient was successfully booked an appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   patient_id:
 *                      type: integer
 *                      description: Id of patient
 *                   doctor_id:
 *                      type: integer
 *                      description: Id of doctor
 *                   slot_id:
 *                      type: integer
 *                      description: Id of slots starting to be  booked
 *                   total_slots:
 *                      type: integer
 *                      description: total number of slots to be booked
 *                   appointment_date:
 *                      type: Date
 *                      description: date for which appointment is to be booked
 *                   status:
 *                      type: string
 *                      description: status of appointment
 *       400:
 *         description: Exceed slots limit or Schedule full
 *       409:
 *         description: overlapping slots
 *       500:
 *         description: Some server error
 */


router.post('/book',(req,res)=>{
    const {patient_id,doctor_id,slot_id,total_slots,appointment_date} = req.body
    if(total_slots > 8) {
        return res.status(400).send({error:"Excceeds slot limit"})
    }
    req.app.knex('doctor_schedule').where({
        doctor_id,
        date:appointment_date
    }).first().then((schedule) => {
        if(!schedule) {
            req.app.knex('doctor_schedule').insert({
                doctor_id,
                slots_booked:total_slots,
                slots_available:32-total_slots,
                total_appointments:1,
                date:appointment_date
            }).then(() => {
                req.app.knex('appointments').insert({
                    patient_id,
                    doctor_id,
                    slot_id,
                    total_slots,
                    appointment_date,
                    status:'booked'
                }).then((appointment) => {
                    return res.status(200).send({appointment:{
                        patient_id,doctor_id,slot_id,total_slots,appointment_date,status:"booked"
                    },message:"Booking Successful"})
                })
            })
        } else if(!schedule.slots_available || schedule.slots_available < total_slots) {
            return res.status(400).send({error:"Slots already booked"})
        } else {
            if(schedule.total_appointments === 12) {
                return res.status(400).send({error:"Schedule full"})
            }
            req.app.knex('appointments').where({
                doctor_id,
                appointment_date,
                status:'booked'
            }).then((appointments) => {
                let index = 0;
                while(appointments[index]) {
                    if((appointments[index].slot_id <= slot_id && slot_id <= appointments[index].slot_id+appointments[index].total_slots-1)
                    ||(appointments[index].slot_id <= slot_id+total_slots-1 && slot_id+total_slots-1 <= appointments[index].slot_id+appointments[index].total_slots-1)) {
                        return res.status(409).send({error:"Overlapping slots"})
                    }
                    index++
                }
                req.app.knex('appointments').insert({
                    patient_id,
                    doctor_id,
                    slot_id,
                    total_slots,
                    appointment_date,
                    status:'booked'
                }).then((appointment) => {
                    req.app.knex('doctor_schedule').where({
                        doctor_id,
                        date:appointment_date
                    }).update({
                        slots_booked:schedule.slots_booked+total_slots,
                        slots_available:schedule.slots_available-total_slots,
                        total_appointments:schedule.total_appointments+1,
                    })
                    return res.status(200).send({appointment:{
                        patient_id,doctor_id,slot_id,total_slots,appointment_date,status:"booked"
                    },message:"Booking Successful"})
                })
            })
        }
    })
})
/**
 * @swagger
 * /appointments/{id}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The appointment id
 *     responses:
 *       200:
 *         description: The given appointment has been cancelled
 *       content:
 *         application/json:
 *           schema:
 *             type: string
 *             description: an appointment is cancelled or not
 *       500:
 *         description: Some server error
 */

router.put('/:id/cancel',(req,res) => {
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 2 || role_id === 1) {
            const { id } = req.params
            req.app.knex('appointments').where({
                id
            }).update({
                status:"canceled",
            }).then((appointment) => {
                if(appointment) {
                    res.status(200).send({message:"Appointment canceled"})
                } else {
                    res.status(500).send({error:"Unable to cancel: No such appointment exists"})
                }
            })
        }
    })
    
})


/**
 * @swagger
 * /appointments/{id}/details:
 *   get:
 *     summary: Get the appointment details by id
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The apppointment id
 *     responses:
 *       200:
 *         description: The appointments details found by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/appointmnent'
 *       404:
 *         description: The appointment was not found
 */

router.get('/:id/details',(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 2 || role_id === 1) {
            const { id } = req.params
            req.app.knex('appointments').select('id','patient_id','doctor_id','slot_id','total_slots','appointment_date','booking_date','status').where({
                id
            }).first().then(data => {
                if(!data){
                    res.sendStatus(404)
                }
                res.status(200).send(data?data:{})
            })
        }
    })
})


/**
 * @swagger
 * /appointments/{patient_id}/history:
 *   get:
 *     summary: Get the patient history by id
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The patient id
 *     responses:
 *       200:
 *         description: The patient history found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/appointmnent'
 *       404:
 *         description: No patient history found was not found
 */

router.get('/:patient_id/history',(req,res)=>{
    req.app.knex('users').where({
        email:res.authenticatedEmail.email
    }).select('role_id').first().then(({role_id}) => {
        if(role_id === 2 || role_id === 3) {
            const { patient_id } = req.params
            req.app.knex('appointments').select('id','patient_id','doctor_id','slot_id','total_slots','appointment_date','booking_date','status').where({
                patient_id
            }).then(data => {
                if(!data){
                    return res.status(400).send({message:"patient appointment does not exist"})
                }
                return res.status(200).send(data?data:{})
            })
        }
    })
})




module.exports = router