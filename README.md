The Teacher’s Lounge app is a social media site for teachers. 
The app serves as an online community for teachers from various backgrounds and experience levels. 
The goal is to have a place for teachers to meet, talk and collaborate.
The app’s design will focus on facilitating simple and meaningful conversations among teachers.

Environment setup:
Install Git and create a GitHub account.
Install VS Code or any code editor of your choice
Install Nodejs (Use LTS version for stability)
Create a Github repo using the files provided. We recommend creating separate repos for the frontend and backend as it will be helpful for development. (Explained later)
Once the repos are set up, navigate to each of the frontend (client) and backend (server) folders and run “npm install” to install all the dependencies of the project.
Install the Expo app on your android phone (Expo Go for ios devices). This will be used to run the app.
Follow the AWS Setup Guide to set up your AWS resources and get AWS credentials for your .env files in the client and server folders. (These files contain sensitive environment variables for use in the project)
Follow the Backend Setup Guide below to have a 24 x 7 running backend server. Here, you will receive your backend url that you can use for your “apiUrl” environment variable.
Once the backend is properly up and running and you have your environment variables filled in, navigate to the client folder and run “npm start” to start a local development server on your machine.
 Finally scan the provided Qr code with your Expo app on android (or the camera app for ios devices which would navigate to Expo Go). This will start the app on your mobile device.

Backend Setup Guide:
The server folder contains all the backend code for the app. You would be making API calls to the backend server and interacting with the database here. For having a constantly running server, we chose to deploy the server on render which provides enough resources to run it.  Follow the steps below to setup your server:
Create an account on render (Only one member doing this would be enough).
Make sure you have the server code in a separate repo as told in Environment Setup.
Follow the guide to create a web service from Git repository: https://render.com/docs/web-services
After successful deployment, you will receive a url to access your node js server. Add it to the “apiUrl” environment variable in the client .env file.
You will also have 3 outbound IP addresses that render will use to make API calls to the database. Add these to the RDS database security group (See AWS Setup Guide).

Testing:
Frontend: For the frontend we used a javascript testing framework called jest for unit testing.
Backend: For testing the backend, we used a tool called PostMan to write automated API tests.
Database: For testing sql queries, we used a tool called MySQL Workbench. It is a very useful tool to manage the database and we highly recommend using it.
