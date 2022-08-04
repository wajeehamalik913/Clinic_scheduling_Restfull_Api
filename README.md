**Rest Api for Clinic Scheduling**

This is a node application that uses express js to develop rest api for clinic systems and use sql to store data. Users can register and login based on their roles i-e doctor, admin or patient. Patients can view all doctors, a particular doctor or available doctors and their available slots based on which they can book an appointment. Doctors or admins can cancel an appointment as well. Admin can see doctors with most appointments on a given day. Endpoints are tested using postman test apis.

****JWT Authentication****

For the authentication and authorization and managing roles without managing sessions. It is a stateless authentication method for users and providers. It provides an access token that can be used as a bearer token to unlock the api access. It also defines who authenticates the access token.
Modules used : dotenv for configuration data & Jsonwebtoken.

**Deployment**

The application is being deployed on azure app service and the sql database is also live on ms sql server. The following method is used to deploy the web app.
Creating a resource group on azure.
Initializing a web app on azure giving required parameters like stack of app and pricing plan.
After that we will deploy the web app to create an app on azure on the sme resource group created before.
Once it is deployed I will go to portal.azure.com where my app service name clinicRestapi is available.
Now will connect it to github source by navigating to deployment center and providing authorization to access github repo where code is available.

The endpoints developed are documented by swagger UI and deployed on azure which can be accessed here:
https://clinicrestapi.azurewebsites.net/api-docs

![iiii2](https://user-images.githubusercontent.com/65126160/182958313-110eb242-ac1c-4ef1-9bfe-b31be0992a94.PNG)

**SwimLane diagram**

![iiii](https://user-images.githubusercontent.com/65126160/182958393-81f0d580-a759-45ad-9290-7895dd85f38f.PNG)


