/*************************************************************************************************
 * This file index.js is the entry point of the application. It contains all the initialization of 
 * variables like env, routes ,app. It also have all the configuration of Mysql and server.
 *************************************************************************************************/

require('dotenv').config() //loads environment variables from a .env file into process.env

const express = require('express') 
const cors = require('cors') //determines which origins are allowed to access server resources

/**
 * JWT, used for stateless authentication mechanisms for users,
 * this means maintaining session is on the client-side 
 * instead of storing sessions on the server
 */
const jwt = require('jsonwebtoken') 
const morgan = require('morgan')


const doctorsApi= require('./routes/doctors') //Routes for managing doctors Api
const authApi=require('./routes/auth') //Routes for managing authentication like login/register Api
const appointmentApi=require('./routes/appointments') //Routes for managing appointments Api


const swaggerUI = require('swagger-ui-express') //allows you to serve swagger-ui generated API docs from express
const swaggerJsDoc = require('swagger-jsdoc') //reads JSDoc-annotated source code and generates an OpenAPI (Swagger) specification.

const PORT = process.env.PORT | 8080



const options = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "Clinic Rest API",
        version: "1.0.0",
        description: "Clinic Scheduling Rest API",
        },
      servers: [
        {
          url: "https://clinicrestapi.azurewebsites.net",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ["./routes/*.js"],
  };
const specs = swaggerJsDoc(options); //specs will be swagger specification.

const app = express();

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs)); //setting up server where the swagger documentation will live

//initializing app to be used in the web
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
app.use('/doctors',doctorsApi)
app.use('/appointments',appointmentApi)
app.use('',authApi)

/**
 * @desc Knex is a query builder for mysql in nodeJs
 * 
 * Configuration of MySql database using knex 
 */
const knex = require('knex')({
    client: 'mssql',
    connection: {
      server : 'clinicrestapi.database.windows.net',
      user : 'rest_api',
      password : 'Clinical123',
      options: {
          port: 1433,
          database : 'Clinic_Api_DB',
          encrypt: true  // mandatory for microsoft azure sql server
      }
    }
  });
app.knex=knex

// starting the server for the app to listen on
app.listen(PORT, () => {
    console.log('this is good foe now')
})
