const express = require('express')

const {authenticateToken}= require('../JWT_Auth')

const router=express.Router()

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
                    res.status(500).send({error:"Unable to cancel"})
                }
            })
        }
    })
    
})

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